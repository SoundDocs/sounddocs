#!/usr/bin/env python3
"""
Entry point for SoundDocs Capture Agent
This avoids relative import issues in PyInstaller builds
"""
import sys
import os
import asyncio
import pathlib
import subprocess
import shutil

# Add the current directory to Python path so we can import capture_agent
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from capture_agent.server import start_server
except ImportError:
    # Fallback for PyInstaller bundle
    import capture_agent.server
    start_server = capture_agent.server.start_server

def check_mkcert():
    """Check if mkcert is installed and available"""
    return shutil.which("mkcert") is not None

def check_certificate_validity(cert_path, key_path):
    """Check if existing certificates are valid and not expired"""
    try:
        import ssl
        import datetime
        
        # Try to load the certificate
        with open(cert_path, 'rb') as f:
            cert_data = f.read()
        
        # Parse the certificate
        cert = ssl.PEM_cert_to_DER_cert(cert_data.decode())
        import cryptography.x509
        cert_obj = cryptography.x509.load_der_x509_certificate(cert)
        
        # Check expiration (handle timezone-aware vs naive datetime comparison)
        now = datetime.datetime.now(datetime.timezone.utc)

        # cryptography <41 has .not_valid_after/.not_valid_before (naive)
        # >=41 also exposes *_utc (aware). Use whichever exists and normalize to aware.
        if hasattr(cert_obj, "not_valid_after_utc"):
            not_valid_after = cert_obj.not_valid_after_utc
            not_valid_before = cert_obj.not_valid_before_utc
        else:
            not_valid_after = cert_obj.not_valid_after.replace(tzinfo=datetime.timezone.utc)
            not_valid_before = cert_obj.not_valid_before.replace(tzinfo=datetime.timezone.utc)
        
        if not_valid_after <= now:
            print("  Certificate has expired")
            return False
            
        if not_valid_before > now:
            print("  Certificate is not yet valid")
            return False
            
        # Check if certificate is for localhost/127.0.0.1
        san_extension = None
        try:
            san_extension = cert_obj.extensions.get_extension_for_oid(
                cryptography.x509.oid.ExtensionOID.SUBJECT_ALTERNATIVE_NAME
            ).value
            
            dns_names = san_extension.get_values_for_type(cryptography.x509.DNSName)
            ip_addresses = san_extension.get_values_for_type(cryptography.x509.IPAddress)
            
            has_localhost = 'localhost' in dns_names
            has_127_0_0_1 = any(str(ip) == '127.0.0.1' for ip in ip_addresses)
            
            if not (has_localhost and has_127_0_0_1):
                print("  Certificate doesn't include required domains (localhost, 127.0.0.1)")
                return False
                
        except cryptography.x509.ExtensionNotFound:
            print("  Certificate missing Subject Alternative Name extension")
            return False
            
        return True
        
    except Exception as e:
        print(f"  Certificate validation error: {e}")
        return False

def setup_certificates():
    """Setup SSL certificates with validation and regeneration"""
    agent_dir = pathlib.Path.home() / ".sounddocs-agent"
    cert_path = agent_dir / "localhost.pem"
    key_path = agent_dir / "localhost-key.pem"
    
    # Create agent directory if it doesn't exist
    agent_dir.mkdir(parents=True, exist_ok=True)
    
    # Check if certificates exist and are valid
    certs_exist = cert_path.exists() and key_path.exists()
    certs_valid = False
    
    if certs_exist:
        print("Checking existing SSL certificates...")
        try:
            certs_valid = check_certificate_validity(cert_path, key_path)
            if certs_valid:
                print("✓ Valid SSL certificates found")
                return True
            else:
                print("✗ Existing certificates are invalid, regenerating...")
        except ImportError:
            print("  Warning: cryptography library not available for validation")
            print("  Assuming existing certificates are valid")
            print("  If connection fails, delete certificates and restart")
            return True
    
    print("Setting up SSL certificates...")
    
    # Check if mkcert is installed
    if not check_mkcert():
        print("✗ mkcert is not installed or not in PATH")
        print("\nTo install mkcert:")
        print("  macOS: brew install mkcert")
        print("  Windows: choco install mkcert")
        print("\nAfter installation, run 'mkcert -install' once, then restart this app.")
        return False
    
    try:
        # Always check and install CA if needed
        print("Verifying mkcert Certificate Authority...")
        ca_root_result = subprocess.run(['mkcert', '-CAROOT'], capture_output=True, text=True)
        if ca_root_result.returncode != 0:
            print("Setting up mkcert Certificate Authority...")
            subprocess.run(['mkcert', '-install'], check=True)
        else:
            ca_root_path = ca_root_result.stdout.strip()
            ca_cert_path = pathlib.Path(ca_root_path) / "rootCA.pem"
            if not ca_cert_path.exists():
                print("Certificate Authority missing, installing...")
                subprocess.run(['mkcert', '-install'], check=True)
            else:
                print("✓ Certificate Authority is installed")
        
        # Remove old certificates if they exist and are invalid
        if certs_exist and not certs_valid:
            print("Removing invalid certificates...")
            cert_path.unlink(missing_ok=True)
            key_path.unlink(missing_ok=True)
        
        # Generate certificates
        print("Generating SSL certificates...")
        original_cwd = os.getcwd()
        os.chdir(agent_dir)
        
        result = subprocess.run([
            'mkcert',
            '-cert-file', 'localhost.pem',
            '-key-file', 'localhost-key.pem',
            'localhost', '127.0.0.1', '::1'
        ], check=True, capture_output=True, text=True)
        
        os.chdir(original_cwd)
        
        print("✓ SSL certificates generated successfully")
        
        # Check for Firefox compatibility
        try:
            subprocess.run(['which', 'certutil'], check=True, capture_output=True)
        except subprocess.CalledProcessError:
            print("\n⚠️  Firefox users: Install 'nss' for Firefox compatibility:")
            print("   macOS: brew install nss")
            print("   Then run: mkcert -install")
        
        return True
        
    except subprocess.CalledProcessError as e:
        print(f"✗ Failed to generate SSL certificates: {e}")
        if e.stderr:
            print(f"Error details: {e.stderr.decode()}")
        return False
    except Exception as e:
        print(f"✗ Certificate setup error: {e}")
        return False

def main():
    """Main entry point for the capture agent."""
    print("============================================")
    print("SoundDocs Capture Agent")
    print("============================================")
    print()
    
    # Setup certificates first
    if not setup_certificates():
        print("\nCertificate setup failed. Please resolve the issues above and try again.")
        input("Press Enter to exit...")
        sys.exit(1)
    
    print()
    print("Starting capture agent server...")
    print("The agent will be available at: wss://127.0.0.1:9469")
    print("Press Ctrl+C to stop.")
    print()
    
    try:
        asyncio.run(start_server())
    except KeyboardInterrupt:
        print("\nCapture agent stopped by user.")
    except Exception as e:
        print(f"\nError starting server: {e}")
        print(f"Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        print("\nPlease check that all dependencies are installed correctly.")
        input("Press Enter to exit...")
        sys.exit(1)

if __name__ == "__main__":
    main()

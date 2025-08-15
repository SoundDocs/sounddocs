import subprocess
import pathlib
import sys

def generate_certificate():
    """
    Checks for the existence of a self-signed certificate and generates one if it's missing.
    """
    cert_path = pathlib.Path(__file__).parent / "localhost.pem"
    key_path = pathlib.Path(__file__).parent / "localhost-key.pem"

    if cert_path.exists() and key_path.exists():
        print("Certificate and key already exist. Skipping generation.")
        return

    print("Generating self-signed certificate for localhost...")
    
    try:
        subprocess.run(
            [
                "openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes",
                "-keyout", str(key_path),
                "-out", str(cert_path),
                "-subj", "/CN=localhost",
            ],
            check=True,
            capture_output=True,
            text=True
        )
        print(f"Successfully generated certificate at: {cert_path}")
        print(f"Successfully generated key at: {key_path}")
    except (subprocess.CalledProcessError, FileNotFoundError) as e:
        print("--------------------------------------------------", file=sys.stderr)
        print("ERROR: Failed to generate SSL certificate.", file=sys.stderr)
        print("Please ensure 'openssl' is installed and available in your system's PATH.", file=sys.stderr)
        if isinstance(e, subprocess.CalledProcessError):
            print("\n--- OpenSSL Error Output ---", file=sys.stderr)
            print(e.stderr, file=sys.stderr)
        print("--------------------------------------------------", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    generate_certificate()

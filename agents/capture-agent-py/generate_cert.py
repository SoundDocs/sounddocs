import subprocess
import pathlib
import sys
import shutil

def check_mkcert_installed():
    """Checks if mkcert is installed and in the system's PATH."""
    return shutil.which("mkcert") is not None

def install_mkcert_ca():
    """Runs 'mkcert -install' to create and install a local CA."""
    print("Attempting to install the mkcert local Certificate Authority (CA)...")
    print("You may be prompted for your password.")
    try:
        subprocess.run(
            ["mkcert", "-install"],
            check=True,
            capture_output=True,
            text=True
        )
        print("Successfully installed the mkcert local CA.")
        return True
    except subprocess.CalledProcessError as e:
        print("--------------------------------------------------", file=sys.stderr)
        print("ERROR: Failed to install the mkcert local CA.", file=sys.stderr)
        print("\n--- mkcert Error Output ---", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        print("--------------------------------------------------", file=sys.stderr)
        return False

def generate_certificate():
    """
    Checks for the existence of a mkcert-signed certificate and generates one if it's missing.
    """
    cert_dir = pathlib.Path(__file__).parent
    cert_path = cert_dir / "localhost.pem"
    key_path = cert_dir / "localhost-key.pem"

    if not check_mkcert_installed():
        print("--------------------------------------------------", file=sys.stderr)
        print("ERROR: 'mkcert' is not installed or not in your PATH.", file=sys.stderr)
        print("Please install mkcert to continue.", file=sys.stderr)
        print("\nInstallation instructions:", file=sys.stderr)
        print("  macOS (Homebrew): brew install mkcert", file=sys.stderr)
        print("  Windows (Chocolatey): choco install mkcert", file=sys.stderr)
        print("  Linux: See https://github.com/FiloSottile/mkcert#installation", file=sys.stderr)
        print("\nAfter installing, you must run 'mkcert -install' once.", file=sys.stderr)
        print("--------------------------------------------------", file=sys.stderr)
        sys.exit(1)

    # Check if the local CA is installed, if not, try to install it.
    # A simple way to check is to see if the rootCA files exist.
    # This is not foolproof but is a good heuristic.
    ca_root_dir = subprocess.run(['mkcert', '-CAROOT'], capture_output=True, text=True).stdout.strip()
    if not (pathlib.Path(ca_root_dir) / "rootCA.pem").exists():
        if not install_mkcert_ca():
            sys.exit(1)

    if cert_path.exists() and key_path.exists():
        print("Certificate and key already exist. Skipping generation.")
        return

    print("Generating mkcert-signed certificate for localhost...")
    
    try:
        subprocess.run(
            [
                "mkcert",
                "-cert-file", str(cert_path),
                "-key-file", str(key_path),
                "localhost", "127.0.0.1", "::1"
            ],
            check=True,
            capture_output=True,
            text=True,
            cwd=cert_dir
        )
        print(f"Successfully generated certificate at: {cert_path}")
        print(f"Successfully generated key at: {key_path}")
    except subprocess.CalledProcessError as e:
        print("--------------------------------------------------", file=sys.stderr)
        print("ERROR: Failed to generate SSL certificate with mkcert.", file=sys.stderr)
        print("\n--- mkcert Error Output ---", file=sys.stderr)
        print(e.stderr, file=sys.stderr)
        print("--------------------------------------------------", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    generate_certificate()

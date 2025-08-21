import os

try:
    # Construct a path to the VERSION file relative to this file's location
    version_path = os.path.join(os.path.dirname(__file__), "VERSION")
    with open(version_path, "r") as f:
        __version__ = f.read().strip()
except FileNotFoundError:
    __version__ = "0.0.0"

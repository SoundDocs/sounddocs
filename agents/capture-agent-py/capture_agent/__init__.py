import tomllib
from pathlib import Path

try:
    # Go up two levels to the pyproject.toml file
    pyproject_path = Path(__file__).parent.parent / "pyproject.toml"
    with open(pyproject_path, "rb") as f:
        data = tomllib.load(f)
        __version__ = data["tool"]["poetry"]["version"]
except (FileNotFoundError, KeyError):
    __version__ = "0.0.0"

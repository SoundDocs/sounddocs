import tomllib

try:
    with open("pyproject.toml", "rb") as f:
        _pyproject_data = tomllib.load(f)
    __version__ = _pyproject_data["tool"]["poetry"]["version"]
except (FileNotFoundError, KeyError):
    __version__ = "0.0.0"

import minify_html
import pathlib

default = pathlib.Path(__file__).resolve().parent
files_to_minify = [
  default / "index.html",
  default / "server.html",
  default / "servers/index.html"
]

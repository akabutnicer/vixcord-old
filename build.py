import minify_html
import pathlib

default = pathlib.Path(__file__).resolve().parent
files_to_minify = [
  default / "./public/index.html",
  default / "./public/server.html",
  default / "./public/index.html",
  default / "./public/server.js",
  default / "./public/style.css"
]


for file in files_to_minify:
  file_content = file.read_text()
  minified = minify_html(file_content, minify_js=True, minify_css=True, do_not_minify_doctype=True)
  file.write_text(minified)

import pathlib
p = pathlib.Path("write_chatpage2.py")
text = p.read_text()
print("Script length:", len(text))
print("Last 300 chars:", repr(text[-300:]))

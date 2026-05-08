import pathlib
p = pathlib.Path("frontend/src/pages/ChatPage.tsx")
text = p.read_text()
print("Length:", len(text))
print("Last 200 chars:", repr(text[-200:]))

import os
import re

def fix_imports_in_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Determine depth of the file from src/
    # e.g. src/shared/components/admin/AdminProjectsTab.tsx -> depth 3
    parts = filepath.replace('\\', '/').split('/src/')
    if len(parts) < 2:
        return
    rel_path = parts[1]
    depth = rel_path.count('/')
    
    # Generate the correct prefix for imports that should go to src/
    prefix = '../' * depth
    if prefix == '':
        prefix = './'

    original = content

    # Replace specific bad paths manually based on the file depth
    # Typical wrong imports: 
    # from '../types/api' or '../../types/api' -> should be from '{prefix}types/api'
    # from '../utils/helpers' or '../../utils/helpers' -> should be from '{prefix}utils/helpers'
    # from '../context/AuthContext' -> should be from '{prefix}context/AuthContext'
    # from '../shared/services/api/...' -> should be from '{prefix}shared/services/api/...'
    
    # We can use regex to replace imports that start with '..' or '.' and end with /types/api, /utils/helpers, /context/AuthContext, /shared/...
    
    # For types/api
    content = re.sub(r"from\s+['\"](?:\.\./)+types/api['\"]", f"from '{prefix}types/api'", content)
    # For utils/helpers
    content = re.sub(r"from\s+['\"](?:\.\./)+utils/helpers['\"]", f"from '{prefix}utils/helpers'", content)
    # For context/AuthContext
    content = re.sub(r"from\s+['\"](?:\.\./)+context/AuthContext['\"]", f"from '{prefix}context/AuthContext'", content)
    
    # For anything in shared/
    def repl_shared(match):
        shared_path = match.group(1)
        return f"from '{prefix}shared/{shared_path}'"
    content = re.sub(r"from\s+['\"](?:\.\./)+shared/(.*?)['\"]", repl_shared, content)

    # Some implicit 'any' fixes
    content = content.replace("m =>", "(m: any) =>")
    content = content.replace("i =>", "(i: any) =>")
    content = content.replace("p =>", "(p: any) =>")
    content = content.replace("a =>", "(a: any) =>")
    content = content.replace("k =>", "(k: any) =>")
    content = content.replace("result =>", "(result: any) =>")
    content = content.replace("insight, idx", "insight: any, idx: number")
    content = content.replace("limit, idx", "limit: any, idx: number")
    content = content.replace("paper =>", "(paper: any) =>")
    content = content.replace("paper:", "paper: any")
    content = content.replace("paper: any any", "paper: any")
    content = content.replace("paper: any: any", "paper: any")

    if original != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Fixed {filepath}")

if __name__ == '__main__':
    src_dir = os.path.join('E:\\', 'PROJECTS', 'ARAS', 'frontend', 'src')
    for root, dirs, files in os.walk(src_dir):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                fix_imports_in_file(os.path.join(root, file))

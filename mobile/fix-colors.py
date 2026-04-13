import os
import re

components_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'components')

color_map = {
    r"'#16A34A'": "theme.colors.primary",
    r"'#15803d'": "theme.colors.primaryDark",
    r"'#15803D'": "theme.colors.primaryDark",
    r"'#2E7D32'": "theme.colors.primary",
    r"'#166534'": "theme.colors.primaryDark",
    r"'#DCFCE7'": "theme.colors.primaryLight",
    r"'#ECC323'": "theme.colors.accent",
    r"'#EF4444'": "theme.colors.error",
    r"'#FFFFFF'": "theme.colors.surface",
    r"'#F8FAF9'": "theme.colors.background",
    r"'#1F2937'": "theme.colors.textPrimary",
    r"'#374151'": "theme.colors.textPrimary",
    r"'#4B5563'": "theme.colors.textSecondary",
    r"'#6B7280'": "theme.colors.textSecondary",
    r"'#9CA3AF'": "theme.colors.textMuted",
    r"'#E5E7EB'": "theme.colors.border",
    r"'#EEF2F7'": "theme.colors.border",
    r"'#F3F4F6'": "theme.colors.divider"
}

def process_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    original_content = content
    has_changes = False

    for hex_code, theme_var in color_map.items():
        if re.search(hex_code, content, re.IGNORECASE):
            content = re.sub(hex_code, theme_var, content, flags=re.IGNORECASE)
            has_changes = True

    if has_changes:
        import_stmt_1 = "from '../theme'"
        import_stmt_2 = "from '../../theme'"
        import_stmt_3 = "from 'theme'"
        
        if import_stmt_1 not in content and import_stmt_2 not in content and import_stmt_3 not in content:
            depth = len(file_path.split(os.sep)) - len(components_dir.split(os.sep))
            import_path = "'../theme'" if depth == 1 else "'../../theme'"
            lines = content.split('\n')
            import_idx = 0
            for i, line in enumerate(lines):
                if line.startswith('import '):
                    import_idx = i + 1
            lines.insert(import_idx, f"import {{ theme }} from {import_path};")
            content = '\n'.join(lines)
            
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated: {os.path.basename(file_path)}")

def traverse(directory):
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith('.tsx') or file.endswith('.ts'):
                process_file(os.path.join(root, file))

if __name__ == "__main__":
    traverse(components_dir)
    print("Color refactor complete.")

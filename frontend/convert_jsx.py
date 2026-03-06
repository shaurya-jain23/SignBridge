import re

html_path = 'stitch_desktop_custom.html'
jsx_path = 'src/pages/LandingPage.jsx'

with open(html_path, 'r') as f:
    html = f.read()

# Extract styles
style_match = re.search(r'<style>(.*?)</style>', html, re.DOTALL)
styles = style_match.group(1).strip() if style_match else ""

# Extract body contents
body_match = re.search(r'<body[^>]*>(.*?)</body>', html, re.DOTALL)
body_content = body_match.group(1).strip() if body_match else ""

# Basic HTML to JSX conversions
jsx_content = body_content.replace('class=', 'className=')
jsx_content = jsx_content.replace('for=', 'htmlFor=')
jsx_content = jsx_content.replace('<!--', '{/*')
jsx_content = jsx_content.replace('-->', '*/}')
jsx_content = jsx_content.replace('<!DOCTYPE html>', '')

# Fix self-closing tags: img, br, hr, input
jsx_content = re.sub(r'<img(.*?)(?<!/)>', r'<img\1 />', jsx_content)
jsx_content = jsx_content.replace('<br>', '<br />')
jsx_content = jsx_content.replace('<hr>', '<hr />')
jsx_content = re.sub(r'<input(.*?)(?<!/)>', r'<input\1 />', jsx_content)

# Replace 'background-dark' and 'background-light' and 'primary', 'secondary' with literal hex colors
# based on tailwind-config from HTML:
# primary: #14b8a5
# secondary: #a855f7
# background-light: #f6f8f8
# background-dark: #0f172a
jsx_content = jsx_content.replace('bg-background-light', 'bg-[#f6f8f8]')
jsx_content = jsx_content.replace('bg-background-dark', 'bg-[#0f172a]')
jsx_content = jsx_content.replace('text-background-dark', 'text-[#0f172a]')
jsx_content = jsx_content.replace('primary', '#14b8a5')
jsx_content = jsx_content.replace('secondary', '#a855f7')

# However, tailwind color classes like text-primary become text-[#14b8a5]
jsx_content = re.sub(r'bg-primary(?:/(\d+))?', lambda m: f"bg-[#14b8a5]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)
jsx_content = re.sub(r'text-primary(?:/(\d+))?', lambda m: f"text-[#14b8a5]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)
jsx_content = re.sub(r'border-primary(?:/(\d+))?', lambda m: f"border-[#14b8a5]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)
jsx_content = re.sub(r'from-primary(?:/(\d+))?', lambda m: f"from-[#14b8a5]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)
jsx_content = re.sub(r'via-primary(?:/(\d+))?', lambda m: f"via-[#14b8a5]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)
jsx_content = re.sub(r'to-primary(?:/(\d+))?', lambda m: f"to-[#14b8a5]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)

jsx_content = re.sub(r'bg-secondary(?:/(\d+))?', lambda m: f"bg-[#a855f7]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)
jsx_content = re.sub(r'text-secondary(?:/(\d+))?', lambda m: f"text-[#a855f7]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)
jsx_content = re.sub(r'border-secondary(?:/(\d+))?', lambda m: f"border-[#a855f7]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)
jsx_content = re.sub(r'from-secondary(?:/(\d+))?', lambda m: f"from-[#a855f7]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)
jsx_content = re.sub(r'via-secondary(?:/(\d+))?', lambda m: f"via-[#a855f7]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)
jsx_content = re.sub(r'to-secondary(?:/(\d+))?', lambda m: f"to-[#a855f7]{'/' + m.group(1) if m.group(1) else ''}", jsx_content)


final_code = f"""import React from "react";
import {{ Link }} from "react-router-dom";

export default function LandingPage() {{
  return (
    <div className="bg-[#f6f8f8] dark:bg-[#0f172a] font-['Inter'] text-slate-900 dark:text-slate-100 antialiased overflow-x-hidden min-h-screen">
      <style>{{`
{styles}
      `}}</style>

      {jsx_content}
    </div>
  );
}}
"""

with open(jsx_path, 'w') as f:
    f.write(final_code)

print("Conversion complete!")

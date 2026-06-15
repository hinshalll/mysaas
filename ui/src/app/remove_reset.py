import os
import re

def clean_reset_class(directory):
    count = 0
    # Match className="... reset ..." or className={`... reset ...`}
    # We will just replace word boundary 'reset' followed by space, or preceded by space, inside className
    # Let's just find and replace exact matches we know exist to be extremely safe:
    # 'className="reset ' -> 'className="'
    # 'className={`reset ' -> 'className={`'
    # ' className="reset"' -> ' className=""'
    # ' "reset ' -> ' "' (for nested logic like `${scrolled ? "reset top-link" : ""}`)

    for root, _, files in os.walk(directory):
        for file in files:
            if file.endswith(('.tsx', '.ts', '.jsx', '.js')):
                filepath = os.path.join(root, file)
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()

                new_content = content.replace('className="reset ', 'className="')
                new_content = new_content.replace('className={`reset ', 'className={`')
                new_content = new_content.replace(' className="reset"', ' className=""')
                new_content = new_content.replace(' "reset ', ' "')
                
                # Check for remaining "reset" inside classNames just in case
                # e.g., <button className="top-link reset"
                new_content = new_content.replace(' reset"', '"')
                new_content = new_content.replace(' reset ', ' ')

                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    count += 1
                    print(f"Updated {filepath}")

    print(f"Total files modified: {count}")

clean_reset_class('c:/Users/hinsh/Desktop/saas-prototype/ui/src/app')

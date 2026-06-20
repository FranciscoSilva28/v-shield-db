"""
================================================================================
INVESTIGADOR DE EMPRESAS - Version Automatica (sin Claude)
================================================================================
Uso:
    python investigador_auto.py "Nombre Empresa" "https://url.com"

Salida:
    wiki_nombre_empresa.md
================================================================================
"""

import sys
import re
import os
from firecrawl import Firecrawl

FIRECRAWL_API_KEY = "fc-acd532c8ad544009b5b6c0ff5724aded"


def extract_links(content):
    """Extrae links del contenido"""
    links = re.findall(r'\[([^\]]+)\]\(([^)]+)\)', content)
    return links[:30]  # Max 30 links


def extract_emails(content):
    """Extrae emails"""
    emails = re.findall(r'[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', content)
    return list(set(emails))[:5]


def extract_phones(content):
    """Extrae telefonos"""
    phones = re.findall(r'[\d\s\-\(\)]{7,}', content)
    clean = [p.strip() for p in phones if len(p.strip()) >= 8]
    return list(set(clean))[:5]


def extract_social(content):
    """Extrae redes sociales"""
    social = {}
    if 'linkedin.com' in content.lower():
        match = re.search(r'https?://[^\s\)]+linkedin\.com[^\s\)]*', content)
        if match: social['LinkedIn'] = match.group()
    if 'twitter.com' in content.lower() or 'x.com' in content.lower():
        match = re.search(r'https?://[^\s\)]+(?:twitter|x)\.com[^\s\)]*', content)
        if match: social['Twitter'] = match.group()
    if 'instagram.com' in content.lower():
        match = re.search(r'https?://[^\s\)]+instagram\.com[^\s\)]*', content)
        if match: social['Instagram'] = match.group()
    if 'facebook.com' in content.lower():
        match = re.search(r'https?://[^\s\)]+facebook\.com[^\s\)]*', content)
        if match: social['Facebook'] = match.group()
    if 'youtube.com' in content.lower():
        match = re.search(r'https?://[^\s\)]+youtube\.com[^\s\)]*', content)
        if match: social['YouTube'] = match.group()
    if 'github.com' in content.lower():
        match = re.search(r'https?://[^\s\)]+github\.com[^\s\)]*', content)
        if match: social['GitHub'] = match.group()
    return social


def extract_headers(content):
    """Extrae headers/titulos"""
    headers = re.findall(r'^#{1,3}\s+(.+)$', content, re.MULTILINE)
    return headers[:20]


def clean_text(content):
    """Limpia el texto de markdown"""
    # Remover imagenes
    text = re.sub(r'!\[.*?\]\(.*?\)', '', content)
    # Remover links pero mantener texto
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Remover lineas vacias multiples
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text


def generate_wiki(name, url, content):
    """Genera el Wikipedia markdown automaticamente"""
    
    links = extract_links(content)
    emails = extract_emails(content)
    phones = extract_phones(content)
    social = extract_social(content)
    headers = extract_headers(content)
    clean = clean_text(content)
    
    # Extraer primera descripcion (primeros parrafos con texto)
    lines = clean.split('\n')
    description_lines = []
    for line in lines:
        line = line.strip()
        if len(line) > 50 and not line.startswith('#') and not line.startswith('|'):
            description_lines.append(line)
            if len(description_lines) >= 3:
                break
    description = '\n\n'.join(description_lines) if description_lines else "Informacion no disponible."
    
    # Construir markdown
    md = f"""# {name}

---

## Resumen Ejecutivo

| Campo | Informacion |
|-------|-------------|
| **Nombre** | {name} |
| **Web** | {url} |
| **Fecha** | {__import__('datetime').datetime.now().strftime('%Y-%m-%d')} |

---

## Descripcion

{description}

---

## Secciones del Sitio

"""
    
    # Agregar headers encontrados
    if headers:
        for h in headers[:15]:
            md += f"- {h}\n"
    else:
        md += "- No se encontraron secciones\n"
    
    md += "\n---\n\n## Enlaces del Sitio\n\n"
    
    # Agregar links
    if links:
        seen = set()
        for text, href in links[:20]:
            if href not in seen and not href.startswith('#'):
                md += f"- [{text[:50]}]({href})\n"
                seen.add(href)
    else:
        md += "- No se encontraron enlaces\n"
    
    md += "\n---\n\n## Contacto\n\n"
    
    # Emails
    if emails:
        md += "### Emails\n"
        for email in emails:
            md += f"- {email}\n"
        md += "\n"
    
    # Telefonos
    if phones:
        md += "### Telefonos\n"
        for phone in phones:
            md += f"- {phone}\n"
        md += "\n"
    
    # Redes sociales
    if social:
        md += "### Redes Sociales\n"
        for red, link in social.items():
            md += f"- **{red}**: {link}\n"
        md += "\n"
    
    if not emails and not phones and not social:
        md += "- No se encontro informacion de contacto\n"
    
    md += f"""
---

## Contenido Raw (Preview)

```
{clean[:2000]}
```

---

*Generado automaticamente desde {url}*
"""
    
    return md


def main():
    if len(sys.argv) < 3:
        print("\n" + "="*50)
        print("INVESTIGADOR AUTO")
        print("="*50)
        name = input("\nNombre: ")
        url = input("URL: ")
    else:
        name = sys.argv[1]
        url = sys.argv[2]
    
    if not url.startswith('http'):
        url = 'https://' + url
    
    print(f"\n[1/3] Scrapeando {name}...")
    
    app = Firecrawl(api_key=FIRECRAWL_API_KEY)
    result = app.scrape(url)
    content = result.markdown if result.markdown else ""
    
    print(f"      OK - {len(content)} caracteres")
    
    print("[2/3] Generando Wikipedia...")
    wiki = generate_wiki(name, url, content)
    print("      OK")
    
    print("[3/3] Guardando...")
    script_dir = os.path.dirname(os.path.abspath(__file__))
    safe_name = re.sub(r'[^\w\-]', '_', name.lower())
    filename = os.path.join(script_dir, f"wiki_{safe_name}.md")
    
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(wiki)
    
    print(f"      OK")
    print("\n" + "="*50)
    print(f"COMPLETADO! Archivo: wiki_{safe_name}.md")
    print("="*50 + "\n")


if __name__ == "__main__":
    main()

# Investigador de Empresas

Genera documentacion tipo Wikipedia en Markdown de cualquier empresa/sitio web.

## Requisitos

```bash
pip install firecrawl-py
```

## Configuracion

Configura tu API key de Firecrawl como variable de entorno:

**Windows (PowerShell):**
```powershell
$env:FIRECRAWL_API_KEY = "tu-api-key"
```

**Windows (CMD):**
```cmd
set FIRECRAWL_API_KEY=tu-api-key
```

**Linux/Mac:**
```bash
export FIRECRAWL_API_KEY="tu-api-key"
```

Obtiene tu API key en: https://firecrawl.dev

## Uso

```bash
python investigador_auto.py "Nombre Empresa" "https://url.com"
```

## Ejemplos

```bash
python investigador_auto.py "Platanus" "https://platan.us"
python investigador_auto.py "Allianz Mexico" "https://www.allianz.com.mx"
python investigador_auto.py "Banamex" "https://www.banamex.com"
```

## Flujo

1. Ejecutas el comando con nombre y URL
2. Firecrawl scrapea el sitio
3. Se genera automaticamente `wiki_nombre.md`

## Salida

`wiki_nombre.md` - Documento con:
- Resumen ejecutivo
- Descripcion
- Secciones del sitio
- Enlaces
- Contacto (emails, telefonos, redes sociales)
- Preview del contenido raw

## API

- **Firecrawl** - Scraping del sitio web

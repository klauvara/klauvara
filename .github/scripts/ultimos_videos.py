"""
Pone en index.html los 3 últimos vídeos largos del canal de YouTube.

Lee el feed público del canal, descarta los Shorts, guarda las miniaturas
en .webp dentro de la propia web (así no se carga nada de Google) y
reescribe el bloque entre <!-- VIDEOS:INICIO --> y <!-- VIDEOS:FIN -->.

    python .github/scripts/ultimos_videos.py .

Lo ejecuta GitHub Actions cada 6 horas (.github/workflows/ultimos-videos.yml).
Si lo ejecutas en tu ordenador, pásale la carpeta web/.
"""
import html, io, os, re, sys, urllib.error, urllib.request
import xml.etree.ElementTree as ET
from PIL import Image

CANAL = 'UCF8dxgPlekK9sWiIiDuDWKg'  # @klauvara
CUANTOS = 3
NS = {'a': 'http://www.w3.org/2005/Atom', 'yt': 'http://www.youtube.com/xml/schemas/2015'}
# SOCS=CAI = cookies de YouTube rechazadas: así desde Europa no redirige a la página de consentimiento
UA = {'User-Agent': 'curl/8.5.0', 'Cookie': 'SOCS=CAI'}

carpeta = sys.argv[1] if len(sys.argv) > 1 else '.'
pagina = os.path.join(carpeta, 'index.html')


def descargar(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=30) as r:
        return r.read()


class SinRedirigir(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, *a, **k):
        return None


def es_short(video_id):
    # /shorts/ID responde 200 si es un Short y redirige (303) si es un vídeo normal
    abrir = urllib.request.build_opener(SinRedirigir)
    try:
        return abrir.open(urllib.request.Request(f'https://www.youtube.com/shorts/{video_id}', headers=UA), timeout=30).status == 200
    except urllib.error.HTTPError as e:
        if e.code in (301, 302, 303) and '/watch' in (e.headers.get('Location') or ''):
            return False
        sys.exit(f'No sé si {video_id} es un Short (respuesta {e.code}); no cambio nada.')


def miniatura(video_id):
    nombre = f'yt-{video_id}.webp'
    ruta = os.path.join(carpeta, nombre)
    if not os.path.exists(ruta):
        for calidad in ('maxresdefault', 'sddefault', 'hqdefault'):
            try:
                datos = descargar(f'https://i.ytimg.com/vi/{video_id}/{calidad}.jpg')
                break
            except urllib.error.HTTPError:
                continue
        img = Image.open(io.BytesIO(datos)).convert('RGB')
        # las de menor calidad traen franjas negras: se recorta a 16:9
        w, h = img.size
        alto = round(w * 9 / 16)
        if alto < h:
            arriba = (h - alto) // 2
            img = img.crop((0, arriba, w, arriba + alto))
        img.resize((1280, 720), Image.LANCZOS).save(ruta, 'WEBP', quality=80, method=6)
    return nombre


feed = ET.fromstring(descargar(f'https://www.youtube.com/feeds/videos.xml?channel_id={CANAL}'))
videos = []
for entrada in feed.findall('a:entry', NS):
    video_id = entrada.find('yt:videoId', NS).text
    if es_short(video_id):
        continue
    videos.append((video_id, entrada.find('a:title', NS).text.strip()))
    if len(videos) == CUANTOS:
        break
if len(videos) < CUANTOS:
    sys.exit('No he encontrado suficientes vídeos en el feed; no cambio nada.')

bloque = []
for i, (video_id, titulo) in enumerate(videos):
    t = html.escape(titulo)
    clase = 'video video--feat reveal' if i == 0 else 'video reveal'
    lazy = '' if i == 0 else ' loading="lazy"'
    bloque.append(
        f'          <a class="{clase}" href="https://www.youtube.com/watch?v={video_id}" target="_blank" rel="noopener">\n'
        f'            <span class="video__img"><img src="{miniatura(video_id)}" alt="Miniatura del vídeo: {t}" decoding="async"{lazy} width="1280" height="720"><span class="play" aria-hidden="true"></span></span>\n'
        f'            <h3>{t}</h3>\n'
        f'          </a>\n')

h = open(pagina, encoding='utf-8').read()
nuevo = re.sub(r'(<!-- VIDEOS:INICIO -->\n).*?(\s*<!-- VIDEOS:FIN -->)', lambda m: m.group(1) + ''.join(bloque).rstrip('\n') + m.group(2), h, count=1, flags=re.S)
if nuevo == h:
    print('Los vídeos ya estaban al día.')
else:
    open(pagina, 'w', encoding='utf-8', newline='').write(nuevo)
    print('Vídeos actualizados:', ', '.join(v for v, _ in videos))

# borra miniaturas de vídeos que ya no salen
en_uso = {f'yt-{v}.webp' for v, _ in videos}
for f in os.listdir(carpeta):
    if f.startswith('yt-') and f.endswith('.webp') and f not in en_uso:
        os.remove(os.path.join(carpeta, f))

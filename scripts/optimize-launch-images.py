from PIL import Image, ImageOps, ImageDraw
from pathlib import Path
import json
sources=json.loads(r'''{"silver-gray":"C:\\Users\\N.N.Adil\\.codex\\generated_images\\01a182c9-cc70-7e41-a38b-5233c0c702ec\\exec-ae941879-60a4-4816-bf03-e1b821d4c39a.png","snow-blue":"C:\\Users\\N.N.Adil\\.codex\\generated_images\\01a182c9-cc70-7e41-a38b-5233c0c702ec\\exec-0fa76061-cdad-426a-91ba-2a2cae8c225c.png","bright-red":"C:\\Users\\N.N.Adil\\.codex\\generated_images\\01a182c9-cc70-7e41-a38b-5233c0c702ec\\exec-27e19b45-1970-4cca-a3cb-573d6fd0f2ea.png","brown":"C:\\Users\\N.N.Adil\\.codex\\generated_images\\01a182c9-cc70-7e41-a38b-5233c0c702ec\\exec-ba8d2d89-5f4c-45b5-800a-13ae57b25ece.png","camel":"C:\\Users\\N.N.Adil\\.codex\\generated_images\\01a182c9-cc70-7e41-a38b-5233c0c702ec\\exec-93cce091-2d8d-422d-9ab1-7fc18f114118.png","champagne":"C:\\Users\\N.N.Adil\\.codex\\generated_images\\01a182c9-cc70-7e41-a38b-5233c0c702ec\\exec-5c28aa40-cbb3-4c14-ac50-a4ae370bb710.png","dark-gray":"C:\\Users\\N.N.Adil\\.codex\\generated_images\\01a182c9-cc70-7e41-a38b-5233c0c702ec\\exec-1db9b875-e349-4901-92ae-4eb57a350853.png","glass-green":"C:\\Users\\N.N.Adil\\.codex\\generated_images\\01a182c9-cc70-7e41-a38b-5233c0c702ec\\exec-8f2cc90a-d3a5-49a1-91b8-0dc79a1c5424.png"}''')
out=Path(__file__).resolve().parent.parent/'dist'/'assets'/'variants'
out.mkdir(parents=True,exist_ok=True)
board=Image.new('RGB',(1200,640),'#faf6ed')
for i,(name,source) in enumerate(sources.items()):
    im=Image.open(source).convert('RGB')
    im.thumbnail((1100,1100),Image.Resampling.LANCZOS)
    dest=out/(name+'.webp')
    im.save(dest,'WEBP',quality=86,method=6)
    tile=ImageOps.contain(im,(300,280))
    x=(i%4)*300;y=(i//4)*320
    board.paste(tile,(x,y))
    ImageDraw.Draw(board).text((x+12,y+288),name,fill='#123b4d')
    print(name,im.size,dest.stat().st_size)
board.save(out/'review-contact-sheet.jpg',quality=88)

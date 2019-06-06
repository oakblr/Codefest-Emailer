import pyqrcode
import sys
from PIL import Image
from PIL import ImageFont
from PIL import ImageDraw 
name = sys.argv[2]
qr = pyqrcode.create(sys.argv[1])
#qr = pyqrcode.create("test")
#qr.png('test.png')
qrLocation = "./tickets/qrCode-" + name + ".png"
qr.png(qrLocation, scale=5, module_color=(0, 0, 0, 255), background=(0xff, 0xff, 0xff, 00))

img = Image.open(qrLocation, 'r').convert("RGBA")
img_w, img_h = img.size

background = Image.open('frontOfTicket.png', 'r').convert("RGBA")
bg_w, bg_h = background.size

offset = ((((bg_w - img_w) // 2)+ 315), ((bg_h - img_h) // 2))
background.paste(img, offset, img)
draw = ImageDraw.Draw(img)
# font = ImageFont.truetype(<font-file>, <font-size>)
#fonts_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'fonts')

font = ImageFont.truetype("DejaVuSans.ttf", 100)
# draw.text((x, y),"Sample Text",(r,g,b))
#draw.text((((bg_w - img_w) // 2), ((bg_h - img_h) // 2) ),"Hello",(255,255,255),font=font)
outputLocation = "./tickets/out-"+name+".png"
background.save(outputLocation)

success = True
print(success)
sys.stdout.flush()

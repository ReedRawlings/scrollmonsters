"""Recreate templates/node_input_labels_en.json (node input names by slot) from the installed Pixel Composer.
It's the app's own locale data, so it isn't committed; run this once after cloning."""
import zipfile, os, sys
APP = sys.argv[1] if len(sys.argv) > 1 else "/Applications/PixelComposer.app"
out = os.path.join(os.path.dirname(os.path.abspath(__file__)), "templates", "node_input_labels_en.json")
with zipfile.ZipFile(os.path.join(APP, "Contents/Resources/pack/locale.zip")) as z:
    name = next(n for n in z.namelist() if n.endswith("en/nodes.json"))
    open(out, "wb").write(z.read(name))
print("wrote", out)

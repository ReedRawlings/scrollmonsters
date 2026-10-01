#!/usr/bin/env python3
"""Assembles the gameplay clip and the trailer from the recorded PNG frames."""
import json, subprocess, sys, os
SCRIPTS = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(SCRIPTS, '../..'))
HERE = os.path.join(REPO, 'output/media')  # recorded frames
FONT = f'{REPO}/assets/ui/font_medium_9px.ttf'
MUSIC = f'{REPO}/assets/music'
OUT = os.path.join(HERE, 'out')
FPS = 60
os.makedirs(OUT, exist_ok=True)

def run(cmd):
    print(' '.join(cmd)[:400] + ' ...')
    subprocess.run(cmd, check=True)

def esc(t):
    return t.replace('\\', '\\\\').replace(':', '\\:').replace("'", "’").replace('%', '\\%')

def gameplay(track='10 - Dark Castle.ogg', seconds=20):
    v = (f"[0:v]trim=end_frame={seconds*FPS},setpts=PTS-STARTPTS,fade=t=out:st={seconds-0.5}:d=0.5,format=yuv420p[v];"
         f"[1:a]atrim=0:{seconds},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.4,afade=t=out:st={seconds-1.8}:d=1.8,loudnorm=I=-16:TP=-1.5:LRA=11,aresample=48000[a]")
    run(['ffmpeg', '-y', '-loglevel', 'error', '-framerate', str(FPS), '-i', f'{HERE}/gameplay/%05d.png', '-i', f'{MUSIC}/{track}',
         '-filter_complex', v, '-map', '[v]', '-map', '[a]', '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-profile:v', 'high',
         '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-t', str(seconds), f'{OUT}/scrollmonsters-gameplay-20s.mp4'])

# Each segment: shot folder, first frame, frame count, caption (or None).
SEGMENTS = json.loads(open(os.path.join(SCRIPTS, 'segments.json')).read())
XF = 0.3  # crossfade seconds

def caption(label, dur, big=54):
    """Lower-third caption that fades in and out within the segment."""
    t = esc(label)
    a = f"if(lt(t,0.35),0,if(lt(t,0.65),(t-0.35)/0.3,if(lt(t,{dur-0.45}),1,max(0,({dur-0.15}-t)/0.3))))"
    return (f",drawtext=fontfile={FONT}:text='{t}':fontsize={big}:fontcolor=white:alpha='{a}'"
            f":box=1:boxcolor=0x14101c@0.78:boxborderw=26:x=(w-text_w)/2:y=40"
            f":borderw=0:shadowcolor=0x000000@0.9:shadowx=4:shadowy=4")

def trailer(track='17 - Fight.ogg'):
    inputs, chains, durs = [], [], []
    for i, seg in enumerate(SEGMENTS):
        if seg['shot'] == 'END':
            dur = seg['seconds']
            # End card over a blurred, darkened title frame.
            inputs += ['-loop', '1', '-framerate', str(FPS), '-t', str(dur), '-i', f"{HERE}/shots/{seg['bgshot']}/{seg['bg']:05d}.png"]
            lines = (f"scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,gblur=sigma=14,eq=brightness=-0.30:saturation=0.75"
                     f",drawtext=fontfile={FONT}:text='SCROLL MONSTERS':fontsize=126:fontcolor=0xffd36b:x=(w-text_w)/2:y=h*0.30"
                     f":shadowcolor=0x000000:shadowx=8:shadowy=8:alpha='min(1,t/0.5)'"
                     f",drawtext=fontfile={FONT}:text='{esc(seg['tagline'])}':fontsize=54:fontcolor=white:x=(w-text_w)/2:y=h*0.50"
                     f":shadowcolor=0x000000:shadowx=4:shadowy=4:alpha='min(1,max(0,(t-0.5)/0.5))'"
                     f",drawtext=fontfile={FONT}:text='{esc(seg['cta'])}':fontsize=45:fontcolor=0x9beaff:x=(w-text_w)/2:y=h*0.64"
                     f":shadowcolor=0x000000:shadowx=4:shadowy=4:alpha='min(1,max(0,(t-1.1)/0.5))'")
            chains.append(f"[{i}:v]{lines},fps={FPS},setsar=1,format=yuv420p,trim=duration={dur},setpts=PTS-STARTPTS[s{i}]")
        else:
            dur = seg['frames'] / FPS
            inputs += ['-framerate', str(FPS), '-start_number', str(seg['start']), '-i', f"{HERE}/shots/{seg['shot']}/%05d.png"]
            cap = caption(seg['caption'], dur) if seg.get('caption') else ''
            # Game frame scaled to 1080p height, centred over a blurred copy that fills the 16:9 sides.
            chains.append(f"[{i}:v]trim=end_frame={seg['frames']},setpts=PTS-STARTPTS,split[a{i}][b{i}];"
                          f"[a{i}]scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,gblur=sigma=24,eq=brightness=-0.28[bg{i}];"
                          f"[b{i}]scale=-2:1080:flags=lanczos[fg{i}];"
                          f"[bg{i}][fg{i}]overlay=(W-w)/2:0{cap},setsar=1,format=yuv420p[s{i}]")
        durs.append(dur)
    # Crossfade chain.
    last, offset, xf = 's0', 0.0, []
    for i in range(1, len(durs)):
        offset += durs[i - 1] - XF
        kind = 'fadeblack' if SEGMENTS[i]['shot'] == 'END' or i == 1 else 'fade'
        xf.append(f"[{last}][s{i}]xfade=transition={kind}:duration={XF}:offset={offset:.4f}[x{i}]")
        last = f'x{i}'
    total = sum(durs) - XF * (len(durs) - 1)
    a = len(SEGMENTS)
    graph = ';'.join(chains + xf) + f";[{last}]fade=t=in:st=0:d=0.3,format=yuv420p[vout];" + \
        f"[{a}:a]atrim=0:{total:.3f},asetpts=PTS-STARTPTS,afade=t=in:st=0:d=0.2,afade=t=out:st={total-2.2:.3f}:d=2.2,loudnorm=I=-15:TP=-1.5:LRA=11,aresample=48000[aout]"
    print('trailer length', round(total, 2), 's')
    run(['ffmpeg', '-y', '-loglevel', 'error'] + inputs + ['-i', f'{MUSIC}/{track}', '-filter_complex', graph, '-map', '[vout]', '-map', '[aout]',
         '-c:v', 'libx264', '-preset', 'slow', '-crf', '18', '-profile:v', 'high', '-r', str(FPS), '-c:a', 'aac', '-b:a', '192k',
         '-movflags', '+faststart', '-t', f'{total:.3f}', f'{OUT}/scrollmonsters-trailer-30s.mp4'])

if __name__ == '__main__':
    what = sys.argv[1] if len(sys.argv) > 1 else 'both'
    if what in ('gameplay', 'both'): gameplay()
    if what in ('trailer', 'both'): trailer()

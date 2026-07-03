'use client'

import { useState, useEffect, useCallback, useRef, createContext, useContext } from 'react'

const AudioCtx = createContext<{
  audioContext: AudioContext | null
  analyser: AnalyserNode | null
  gainNode: GainNode | null
  synthParams: { attack: number; filter: number; distortion: number; pitchBend: number }
  setSynthParams: (p: any) => void
}>({ audioContext: null, analyser: null, gainNode: null, synthParams: { attack: 0.1, filter: 0.3, distortion: 0.3, pitchBend: 0.5 }, setSynthParams: () => {} })

const whiteKeys = ['C4','D4','E4','F4','G4','A4','B4','C5','D5','E5','F5','G5','A5','B5']
const blackKeyDefs = [
  { note: 'C#4', pos: 40 }, { note: 'D#4', pos: 79 },
  { note: 'F#4', pos: 157 }, { note: 'G#4', pos: 196 }, { note: 'A#4', pos: 235 },
  { note: 'C#5', pos: 313 }, { note: 'D#5', pos: 352 },
  { note: 'F#5', pos: 430 }, { note: 'G#5', pos: 469 }, { note: 'A#5', pos: 508 },
]

function PianoKey({ note, isBlack = false, isPressed = false, onPress, onRelease }: {
  note: string; isBlack?: boolean; isPressed?: boolean
  onPress: (n: string) => void; onRelease: (n: string) => void
}) {
  if (isBlack) {
    const def = blackKeyDefs.find(d => d.note === note)
    if (!def) return null
    return (
      <button
        className={`absolute top-0 w-[26px] h-[100px] border-2 border-white rounded-[8px] z-10 transition-all duration-75 select-none touch-none ${isPressed ? 'bg-gray-800 scale-95' : 'bg-black hover:bg-gray-900'}`}
        style={{ left: `${def.pos}px`, transform: 'translateX(-50%)', touchAction: 'none' }}
        onMouseDown={() => onPress(note)} onMouseUp={() => onRelease(note)} onMouseLeave={() => onRelease(note)}
        onTouchStart={(e) => { e.preventDefault(); onPress(note) }}
        onTouchEnd={(e) => { e.preventDefault(); onRelease(note) }}
      />
    )
  }
  return (
    <button
      className={`w-[40px] h-[160px] border-2 border-white rounded-[10px] -ml-[1px] first:ml-0 transition-all duration-75 select-none touch-none ${isPressed ? 'bg-gray-800 scale-95' : 'bg-black hover:bg-gray-900'}`}
      style={{ touchAction: 'none' }}
      onMouseDown={() => onPress(note)} onMouseUp={() => onRelease(note)} onMouseLeave={() => onRelease(note)}
      onTouchStart={(e) => { e.preventDefault(); onPress(note) }}
      onTouchEnd={(e) => { e.preventDefault(); onRelease(note) }}
    />
  )
}

const VERT = `attribute vec2 a_position;varying vec2 vUv;void main(){vUv=a_position*0.5+0.5;gl_Position=vec4(a_position,0.0,1.0);}`
const FRAG = `precision mediump float;uniform float u_time;uniform vec2 u_resolution;uniform float u_scale;uniform vec3 u_color1,u_color2,u_color3,u_color4;uniform float u_octaves,u_persistence,u_lacunarity,u_volume,u_frequency,u_bass,u_mid,u_treble;varying vec2 vUv;vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x,289.0);}vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-0.85373472095314*r;}vec3 fade(vec3 t){return t*t*t*(t*(t*6.0-15.0)+10.0);}float cnoise(vec3 P){vec3 Pi0=floor(P),Pi1=Pi0+vec3(1.0);Pi0=mod(Pi0,289.0);Pi1=mod(Pi1,289.0);vec3 Pf0=fract(P),Pf1=Pf0-vec3(1.0);vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);vec4 iy=vec4(Pi0.yy,Pi1.yy);vec4 iz0=Pi0.zzzz,iz1=Pi1.zzzz;vec4 ixy=permute(permute(ix)+iy);vec4 ixy0=permute(ixy+iz0),ixy1=permute(ixy+iz1);vec4 gx0=ixy0/7.0,gy0=fract(floor(gx0)/7.0)-0.5;gx0=fract(gx0);vec4 gz0=vec4(0.5)-abs(gx0)-abs(gy0);vec4 sz0=step(gz0,vec4(0.0));gx0-=sz0*(step(0.0,gx0)-0.5);gy0-=sz0*(step(0.0,gy0)-0.5);vec4 gx1=ixy1/7.0,gy1=fract(floor(gx1)/7.0)-0.5;gx1=fract(gx1);vec4 gz1=vec4(0.5)-abs(gx1)-abs(gy1);vec4 sz1=step(gz1,vec4(0.0));gx1-=sz1*(step(0.0,gx1)-0.5);gy1-=sz1*(step(0.0,gy1)-0.5);vec3 g000=vec3(gx0.x,gy0.x,gz0.x),g100=vec3(gx0.y,gy0.y,gz0.y),g010=vec3(gx0.z,gy0.z,gz0.z),g110=vec3(gx0.w,gy0.w,gz0.w),g001=vec3(gx1.x,gy1.x,gz1.x),g101=vec3(gx1.y,gy1.y,gz1.y),g011=vec3(gx1.z,gy1.z,gz1.z),g111=vec3(gx1.w,gy1.w,gz1.w);vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));g000*=norm0.x;g010*=norm0.y;g100*=norm0.z;g110*=norm0.w;vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));g001*=norm1.x;g011*=norm1.y;g101*=norm1.z;g111*=norm1.w;float n000=dot(g000,Pf0),n100=dot(g100,vec3(Pf1.x,Pf0.yz)),n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z)),n110=dot(g110,vec3(Pf1.xy,Pf0.z)),n001=dot(g001,vec3(Pf0.xy,Pf1.z)),n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z)),n011=dot(g011,vec3(Pf0.x,Pf1.yz)),n111=dot(g111,Pf1);vec3 fxyz=fade(Pf0);vec4 nz=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fxyz.z);vec2 nyz=mix(nz.xy,nz.zw,fxyz.y);return 2.18*mix(nyz.x,nyz.y,fxyz.x);}float fbm(vec3 p){float v=0.0,a=0.5,f=1.0;for(float i=0.0;i<6.0;i++){if(i>=u_octaves)break;v+=a*cnoise(p*f);f*=u_lacunarity;a*=u_persistence;}return v;}float ridgedFBM(vec3 p){float v=0.0,a=0.5,f=1.0;for(float i=0.0;i<3.0;i++){v+=a*(1.0-abs(cnoise(p*f)));f*=u_lacunarity;a*=u_persistence;}return v;}void main(){vec2 uv=gl_FragCoord.xy/u_resolution.xy;float t=u_time;float ox=sin(t*0.61)*0.9+cos(t*0.37+1.7)*0.55+sin(t*0.19+3.1)*0.3;float oy=cos(t*0.53)*0.9+sin(t*0.41+0.9)*0.55+cos(t*0.27+2.3)*0.3;float oz=sin(t*0.29+0.4)*0.7+cos(t*0.71+1.1)*0.4;vec3 p0=vec3(uv*u_scale+vec2(ox,oy),oz);vec3 p1=vec3(uv*u_scale+vec2(ox+5.2,oy+1.3),oz+0.7);vec2 warp1=vec2(fbm(p0),fbm(p1));vec3 q0=vec3(uv*u_scale+1.7*warp1+vec2(ox*0.5,oy*0.5),oz+0.3);vec3 q1=vec3(uv*u_scale+1.7*warp1+vec2(ox*0.5+8.3,oy*0.5+2.8),oz+1.1);vec2 warp2=vec2(fbm(q0),fbm(q1));vec3 p=vec3(uv*u_scale+2.3*warp2+vec2(ox*0.3,oy*0.3),oz+0.6);p.xy+=u_volume*0.4*vec2(sin(t*1.3+uv.y*3.0),cos(t*0.9+uv.x*3.0));p.y+=sin(uv.x*3.0+t*0.7)*u_bass*0.6;float angle=t*0.8+length(uv-0.5)*5.0;p.xy+=vec2(cos(angle),sin(angle))*u_mid*0.5;float d=fbm(p)*0.5+fbm(p*2.1+vec3(100.0,50.0,25.0))*0.3+ridgedFBM(p*0.8+vec3(200.0,100.0,50.0))*0.2;d=(d+1.0)*0.5;d=smoothstep(0.1,0.9,d);d*=1.0+sin(u_time*3.0)*u_volume*0.4;vec3 c;if(d<0.25)c=mix(u_color1,u_color2,smoothstep(0.0,0.25,d));else if(d<0.5)c=mix(u_color2,u_color3,smoothstep(0.25,0.5,d));else if(d<0.75)c=mix(u_color3,u_color4,smoothstep(0.5,0.75,d));else c=u_color4;float shimmer=sin(uv.x*20.0+u_time*8.0)*sin(uv.y*15.0+u_time*6.0);c+=shimmer*u_treble*0.1*d;gl_FragColor=vec4(c,1.0);}`

function Visualizer() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { analyser } = useContext(AudioCtx)
  const glRef = useRef<WebGLRenderingContext | null>(null)
  const uRef = useRef<Record<string, WebGLUniformLocation>>({})
  const rafRef = useRef(0)
  const startRef = useRef(performance.now())
  const audioRef = useRef({ volume: 0, frequency: 0, bass: 0, mid: 0, treble: 0 })
  const dataRef = useRef<Uint8Array<ArrayBuffer> | null>(null)

  useEffect(() => {
    if (!analyser) return
    dataRef.current = new Uint8Array(analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>
  }, [analyser])

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return
    const gl = canvas.getContext('webgl'); if (!gl) return
    glRef.current = gl

    const compile = (type: number, src: string) => {
      const s = gl.createShader(type)!
      gl.shaderSource(s, src); gl.compileShader(s); return s
    }
    const prog = gl.createProgram()!
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT))
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG))
    gl.linkProgram(prog); gl.useProgram(prog)

    const buf = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buf)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,1,1]), gl.STATIC_DRAW)
    const loc = gl.getAttribLocation(prog, 'a_position')
    gl.enableVertexAttribArray(loc)
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0)

    const u = uRef.current
    const names = ['u_time','u_resolution','u_scale','u_color1','u_color2','u_color3','u_color4',
      'u_octaves','u_persistence','u_lacunarity','u_volume','u_frequency','u_bass','u_mid','u_treble']
    names.forEach(n => {
      const l = gl.getUniformLocation(prog, n)
      if (l) u[n] = l
    })

    gl.uniform2f(u.u_resolution, 180, 180)
    gl.uniform1f(u.u_scale, 2.5)
    gl.uniform3f(u.u_color1, 0.08, 0.12, 0.24)
    gl.uniform3f(u.u_color2, 0.25, 0.35, 0.65)
    gl.uniform3f(u.u_color3, 0.55, 0.75, 0.95)
    gl.uniform3f(u.u_color4, 0.9, 0.95, 1.0)
    gl.uniform1f(u.u_octaves, 6)
    gl.uniform1f(u.u_persistence, 0.5)
    gl.uniform1f(u.u_lacunarity, 2)

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t

    const render = () => {
      rafRef.current = requestAnimationFrame(render)
      const gl = glRef.current!
      const a = audioRef.current

      if (analyser && dataRef.current) {
        analyser.getByteFrequencyData(dataRef.current)
        const arr = dataRef.current
        const len = arr.length
        const vol = arr.reduce((s, v) => s + v, 0) / len / 255
        const bE = Math.floor(len * 0.1)
        const mE = Math.floor(len * 0.4)
        const bass = arr.slice(0, bE).reduce((s, v) => s + v, 0) / bE / 255
        const mid = arr.slice(bE, mE).reduce((s, v) => s + v, 0) / (mE - bE) / 255
        const treble = arr.slice(mE).reduce((s, v) => s + v, 0) / (len - mE) / 255
        a.volume = lerp(a.volume, vol, 0.1)
        a.bass = lerp(a.bass, bass, 0.1)
        a.mid = lerp(a.mid, mid, 0.1)
        a.treble = lerp(a.treble, treble, 0.1)
        const u2 = uRef.current
        gl.uniform3f(u2.u_color1, 0.08 + a.bass * 0.15, 0.12 + a.bass * 0.2, 0.24 + a.bass * 0.3)
        gl.uniform3f(u2.u_color2, 0.25 + a.mid * 0.2, 0.35 + a.mid * 0.25, 0.65 + a.mid * 0.2)
        gl.uniform3f(u2.u_color3, 0.55 + a.treble * 0.25, 0.75 + a.treble * 0.15, 0.95 + a.treble * 0.05)
        gl.uniform3f(u2.u_color4, 0.9 + a.volume * 0.15, 0.95 + a.volume * 0.07, 1.0)
        gl.uniform1f(u2.u_scale, 2.5 + a.volume)
        gl.uniform1f(u2.u_persistence, 0.5 + a.treble * 0.3)
        gl.uniform1f(u2.u_lacunarity, 2.0 + a.mid * 0.5)
      }

      const elapsed = (performance.now() - startRef.current) / 1000
      const speed = 0.025 * (1 + audioRef.current.volume * 1.5)
      const u3 = uRef.current
      gl.uniform1f(u3.u_time, elapsed * speed)
      gl.uniform1f(u3.u_volume, a.volume)
      gl.uniform1f(u3.u_frequency, a.frequency)
      gl.uniform1f(u3.u_bass, a.bass)
      gl.uniform1f(u3.u_mid, a.mid)
      gl.uniform1f(u3.u_treble, a.treble)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }

    render()
    return () => cancelAnimationFrame(rafRef.current)
  }, [analyser])

  return (
    <div className="w-[180px] h-[180px] border-2 border-white rounded-lg overflow-hidden">
      <canvas ref={canvasRef} width={180} height={180} className="w-full h-full" />
    </div>
  )
}

function Controls() {
  const { synthParams, setSynthParams } = useContext(AudioCtx)
  const [isDragging, setIsDragging] = useState<number | null>(null)
  const [sliderDrag, setSliderDrag] = useState(false)

  const getCoords = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e && e.touches.length > 0) return { clientX: e.touches[0].clientX, clientY: e.touches[0].clientY }
    if ('changedTouches' in e && e.changedTouches.length > 0) return { clientX: e.changedTouches[0].clientX, clientY: e.changedTouches[0].clientY }
    return { clientX: (e as React.MouseEvent).clientX, clientY: (e as React.MouseEvent).clientY }
  }

  const handleKnob = (i: number, e: React.MouseEvent | React.TouchEvent) => {
    if (isDragging !== i) return
    const rect = e.currentTarget.getBoundingClientRect()
    const { clientX, clientY } = getCoords(e)
    const angle = Math.atan2(clientY - rect.top - rect.height / 2, clientX - rect.left - rect.width / 2)
    const val = Math.max(0, Math.min(1, (angle + Math.PI) / (2 * Math.PI)))
    const keys = ['attack', 'filter', 'distortion']
    setSynthParams({ ...synthParams, [keys[i]]: val })
  }

  const handleSlider = (e: React.MouseEvent | React.TouchEvent) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const { clientX } = getCoords(e)
    setSynthParams({ ...synthParams, pitchBend: Math.max(0, Math.min(1, (clientX - rect.left) / rect.width)) })
  }

  useEffect(() => {
    if (!sliderDrag) return
    const onMove = (e: MouseEvent | TouchEvent) => {
      const el = document.querySelector('[data-slider]') as HTMLElement; if (!el) return
      const rect = el.getBoundingClientRect()
      const x = 'touches' in e ? e.touches[0].clientX - rect.left : (e as MouseEvent).clientX - rect.left
      setSynthParams({ ...synthParams, pitchBend: Math.max(0, Math.min(1, x / rect.width)) })
    }
    const onUp = () => setSliderDrag(false)
    document.addEventListener('mousemove', onMove, { passive: false })
    document.addEventListener('mouseup', onUp)
    document.addEventListener('touchmove', onMove, { passive: false })
    document.addEventListener('touchend', onUp)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('mouseup', onUp)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onUp)
    }
  }, [sliderDrag, synthParams, setSynthParams])

  return (
    <div className="w-[180px] h-[180px] flex flex-col justify-between touch-none">
      <div className="h-[96px] bg-black border-2 border-white rounded-lg p-2 flex justify-between items-center">
        {[synthParams.attack, synthParams.filter, synthParams.distortion].map((val, i) => (
          <div key={i} className="w-14 h-14 cursor-pointer flex items-center justify-center touch-none"
            onMouseDown={() => setIsDragging(i)}
            onMouseMove={e => handleKnob(i, e)}
            onMouseUp={() => setIsDragging(null)}
            onMouseLeave={() => setIsDragging(null)}
            onTouchStart={e => { e.preventDefault(); setIsDragging(i) }}
            onTouchMove={e => { e.preventDefault(); handleKnob(i, e) }}
            onTouchEnd={e => { e.preventDefault(); setIsDragging(null) }}
            style={{ touchAction: 'none' }}>
            <div className="w-10 h-10 border-2 border-white rounded-full bg-black relative">
              <div className="absolute top-1 left-1/2 w-0.5 h-3 bg-white origin-bottom"
                style={{ transform: `translateX(-50%) rotate(${(val - 0.5) * 270}deg)` }} />
            </div>
          </div>
        ))}
      </div>
      <div className="h-[60px] bg-black border-2 border-white rounded-lg p-2 flex items-center">
        <div className="w-full relative cursor-pointer py-4 touch-none" data-slider
          onMouseDown={e => { setSliderDrag(true); handleSlider(e) }}
          onMouseMove={e => sliderDrag && handleSlider(e)}
          onMouseUp={() => setSliderDrag(false)}
          onTouchStart={e => { setSliderDrag(true); handleSlider(e) }}
          onTouchMove={e => sliderDrag && handleSlider(e)}
          onTouchEnd={() => setSliderDrag(false)}
          style={{ touchAction: 'none' }}>
          <div className="w-full h-1 bg-white rounded-full relative">
            <div className="absolute top-1/2 w-4 h-4 bg-white rounded-full -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${synthParams.pitchBend * 100}%` }} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function PianoApp() {
  const [pressedKeys, setPressedKeys] = useState<Set<string>>(new Set())
  const [audioContext, setAudioContext] = useState<AudioContext | null>(null)
  const [analyser, setAnalyser] = useState<AnalyserNode | null>(null)
  const [gainNode, setGainNode] = useState<GainNode | null>(null)
  const [synthParams, setSynthParams] = useState({ attack: 0.25, filter: 0.3, distortion: 0.7, pitchBend: 0.6 })

  useEffect(() => {
    if (typeof window === 'undefined') return
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const an = ctx.createAnalyser()
    const gain = ctx.createGain()
    an.fftSize = 256
    an.smoothingTimeConstant = 0.8
    gain.connect(an)
    an.connect(ctx.destination)
    setAudioContext(ctx); setAnalyser(an); setGainNode(gain)
  }, [])

  const playNote = useCallback((note: string) => {
    if (!audioContext || !gainNode) return
    const freqs: Record<string, number> = {
      C: 261.63, 'C#': 277.18, D: 293.66, 'D#': 311.13, E: 329.63,
      F: 349.23, 'F#': 369.99, G: 392, 'G#': 415.3, A: 440, 'A#': 466.16, B: 493.88,
    }
    const key = note.slice(0, -1)
    const oct = parseInt(note.slice(-1))
    const base = freqs[key] || 440
    const freq = base * Math.pow(2, oct - 4) * Math.pow(2, (synthParams.pitchBend - 0.5) * 2)
    const osc = audioContext.createOscillator()
    const ng = audioContext.createGain()
    const filter = audioContext.createBiquadFilter()
    const dist = audioContext.createWaveShaper()
    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(200 + synthParams.filter * 8000, audioContext.currentTime)
    filter.Q.setValueAtTime(1 + synthParams.distortion * 10, audioContext.currentTime)
    const curve = new Float32Array(44100)
    const amt = synthParams.distortion * 50
    const deg = Math.PI / 180
    for (let i = 0; i < 44100; i++) {
      const x = (i * 2) / 44100 - 1
      curve[i] = ((3 + amt) * x * 20 * deg) / (Math.PI + amt * Math.abs(x))
    }
    dist.curve = curve
    dist.oversample = '4x'
    osc.connect(filter); filter.connect(dist); dist.connect(ng); ng.connect(gainNode)
    osc.frequency.setValueAtTime(freq, audioContext.currentTime)
    osc.type = 'square'
    const atk = 0.01 + synthParams.attack * 0.3
    ng.gain.setValueAtTime(0, audioContext.currentTime)
    ng.gain.linearRampToValueAtTime(0.1, audioContext.currentTime + atk)
    ng.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
    osc.start(); osc.stop(audioContext.currentTime + 0.5)
  }, [audioContext, gainNode, synthParams])

  const press = useCallback((note: string) => {
    setPressedKeys(p => new Set(p).add(note))
    playNote(note)
  }, [playNote])

  const release = useCallback((note: string) => {
    setPressedKeys(p => { const s = new Set(p); s.delete(note); return s })
  }, [])

  useEffect(() => {
    const map: Record<string, string> = {
      a: 'C4', w: 'C#4', s: 'D4', e: 'D#4', d: 'E4', f: 'F4', t: 'F#4', g: 'G4',
      y: 'G#4', h: 'A4', u: 'A#4', j: 'B4', k: 'C5', o: 'C#5', l: 'D5', p: 'D#5',
      ';': 'E5', "'": 'F5', z: 'F#5', x: 'G5', c: 'G#5', v: 'A5', b: 'A#5', n: 'B5',
    }
    const down = (e: KeyboardEvent) => {
      const n = map[e.key?.toLowerCase()]
      if (n && !pressedKeys.has(n)) press(n)
    }
    const up = (e: KeyboardEvent) => {
      const n = map[e.key?.toLowerCase()]
      if (n) release(n)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => { window.removeEventListener('keydown', down); window.removeEventListener('keyup', up) }
  }, [pressedKeys, press, release])

  return (
    <AudioCtx.Provider value={{ audioContext, analyser, gainNode, synthParams, setSynthParams }}>
      <div className="w-full h-full flex flex-col items-center justify-center relative overflow-hidden select-none"
        style={{
          background: 'black',
          backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(255,255,255,0.2) 1.5px, transparent 0)',
          backgroundSize: '32px 32px',
        }}>
        <div className="absolute top-4 left-4 text-white font-mono text-xs tracking-wider">MINIMAL PIANO</div>
        <div className="absolute top-4 right-4 text-white font-mono text-xs tracking-wider">AURORA</div>
        <div className="flex flex-col items-center gap-6" style={{ transform: 'scale(0.9)' }}>
          <div className="text-white font-mono text-xs tracking-widest">PLAY</div>
          <div className="flex items-center gap-6">
            <Visualizer />
            <div className="relative touch-none">
              <div className="flex">
                {whiteKeys.map(n => (
                  <PianoKey key={n} note={n} isPressed={pressedKeys.has(n)} onPress={press} onRelease={release} />
                ))}
              </div>
              <div className="absolute top-0 left-0">
                {blackKeyDefs.map(({ note }) => (
                  <PianoKey key={note} note={note} isBlack isPressed={pressedKeys.has(note)} onPress={press} onRelease={release} />
                ))}
              </div>
            </div>
            <Controls />
          </div>
        </div>
      </div>
    </AudioCtx.Provider>
  )
}
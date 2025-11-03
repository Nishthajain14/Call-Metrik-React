import { useEffect, useRef, useState } from 'react';
import { Upload, Link2 } from 'lucide-react';
import { AudioUploadAPI, getErrorMessage, isNetworkError } from '../lib/api';
import { useAuth } from '../context/AuthContext';


export default function UploadAudio() {
  const { userId } = useAuth();
  const [tab, setTab] = useState('file');
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const tabsRef = useRef(null);
  const groupRef = useRef(null);
  const fileBtnRef = useRef(null);
  const urlBtnRef = useRef(null);
  const [underline, setUnderline] = useState({ left: 0, width: 0 });

  useEffect(() => {
    function recalc() {
      const fileBtn = fileBtnRef.current;
      const urlBtn = urlBtnRef.current;
      const wrap = groupRef.current || tabsRef.current;
      if (!fileBtn || !urlBtn || !wrap) return;
      const activeBtn = (tab === 'file' ? fileBtn : urlBtn);
      const b = activeBtn.getBoundingClientRect();
      const w = wrap.getBoundingClientRect();
      const half = w.width / 2;
      const idx = (tab === 'file' ? 0 : 1);
      const left = (idx * half) + (half - b.width) / 2; // center within half
      setUnderline({ left, width: b.width });
    }
    recalc();
    const ro = new ResizeObserver(() => recalc());
    if (tabsRef.current) ro.observe(tabsRef.current);
    window.addEventListener('resize', recalc);
    return () => { try { ro.disconnect(); } catch {} window.removeEventListener('resize', recalc); };
  }, [tab]);

  function onPick(e) {
    const list = Array.from(e.target.files || []);
    setFiles(list);
    setMessage('');
    setError('');
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const list = Array.from(e.dataTransfer.files || []);
    setFiles(list);
    setMessage('');
    setError('');
  }

  async function onUploadFiles() {
    try {
      if (!files.length || !userId) return;
      setLoading(true);
      setMessage('');
      setError('');
      const res = await AudioUploadAPI.uploadFile(userId, files);
      setMessage(typeof res === 'string' ? res : 'Uploaded successfully');
      setFiles([]);
    } catch (e) {
      const msg = getErrorMessage(e, 'Failed to upload');
      setError(isNetworkError(e) ? 'Network error. Please check your connection.' : msg);
    } finally {
      setLoading(false);
    }
  }

  async function onUploadUrl() {
    try {
      if (!url.trim() || !userId) return;
      setLoading(true);
      setMessage('');
      setError('');
      const res = await AudioUploadAPI.uploadUrl(userId, url.trim());
      setMessage(typeof res === 'string' ? res : 'URL submitted successfully');
      setUrl('');
    } catch (e) {
      const msg = getErrorMessage(e, 'Failed to submit URL');
      setError(isNetworkError(e) ? 'Network error. Please check your connection.' : msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold">Upload Audio</div>

      {/* Tabs container looks part of the page */}
      <div className="rounded-2xl bg-neutral-900/50 border border-neutral-900 overflow-hidden">
        <div className="relative px-4 pt-3 border-b border-neutral-800" ref={tabsRef}>
          <div ref={groupRef} className="relative mx-auto w-full max-w-3xl grid grid-cols-2 items-center justify-items-center">
            <button
              ref={fileBtnRef}
              className={`py-2.5 text-sm flex items-center justify-center gap-2 font-medium ${tab==='file'?'text-white':'text-neutral-400'}`}
              onClick={() => setTab('file')}
            >
              <Upload size={16} /> Upload Audio
            </button>
            <button
              ref={urlBtnRef}
              className={`py-2.5 text-sm flex items-center justify-center gap-2 font-medium ${tab==='url'?'text-white':'text-neutral-400'}`}
              onClick={() => setTab('url')}
            >
              <Link2 size={16} /> Upload URL
            </button>
            {/* active underline segment under group */}
            <div className="absolute -bottom-[1px] left-0 h-0.5 bg-violet-500 transition-all duration-200" style={{ width: underline.width, transform: `translateX(${underline.left}px)` }} />
          </div>
        </div>
        {/* space under tabs */}

        {tab === 'file' && (
          <div className="p-6">
            <div className="max-w-3xl mx-auto">
              {/* inner panel */}
              <div
                onDragOver={(e)=>{e.preventDefault(); setDragOver(true);}}
                onDragLeave={()=>setDragOver(false)}
                onDrop={onDrop}
                className={`rounded-2xl border ${dragOver? 'border-violet-500 bg-neutral-900/60':'border-neutral-800'} p-6 sm:p-8 flex flex-col items-center gap-4`}
              >
                <div className="w-full">
                  <label className="w-full flex items-center justify-between gap-3 border border-neutral-700 rounded-full px-4 py-2 cursor-pointer hover:border-violet-500">
                    <span className="text-sm text-neutral-300 truncate">{files.length? `${files.length} selected` : 'Choose audio files'}</span>
                    <input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac" className="hidden" multiple onChange={onPick} />
                    <span className="text-xs bg-neutral-800 border border-neutral-700 rounded-full px-3 py-1">Browse</span>
                  </label>
                </div>
                {!!files.length && (
                  <ul className="w-full text-sm text-neutral-300 space-y-1 max-h-40 overflow-auto">
                    {files.map((f,i)=> (
                      <li key={i} className="flex items-center justify-between gap-3 bg-neutral-900/50 px-3 py-2 rounded-md">
                        <span className="truncate">{f.name}</span>
                        <button onClick={()=> setFiles(files.filter((_,x)=>x!==i))} className="text-neutral-400 hover:text-red-400 text-xs">Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={onUploadFiles} disabled={!files.length || loading} className="w-full bg-neutral-700 text-neutral-200 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-md px-4 py-2 text-sm mt-2">
                  {loading? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'url' && (
          <div className="p-6">
            <div className="max-w-2xl mx-auto space-y-4">
              <input
                value={url}
                onChange={(e)=> setUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="w-full bg-neutral-900 border border-neutral-800 focus:border-violet-600 outline-none rounded-full px-4 py-2 text-sm"
              />
              <button onClick={onUploadUrl} disabled={!url.trim() || loading} className="w-full bg-neutral-700 text-neutral-200 hover:bg-neutral-600 disabled:bg-neutral-800 disabled:text-neutral-500 rounded-md px-4 py-2 text-sm">
                {loading? 'Submitting...' : 'Upload'}
              </button>
            </div>
          </div>
        )}
      </div>

      {(message || error) && (
        <div className={`p-3 rounded-md text-sm ${error? 'bg-red-950/40 text-red-300 border border-red-800':'bg-emerald-950/40 text-emerald-300 border border-emerald-800'}`}>
          {error || message}
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import { Upload, Link2 } from 'lucide-react';
import { AudioUploadAPI, getErrorMessage, isNetworkError } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useLoading } from '../context/LoadingContext';
import { useNotifications } from '../context/NotificationContext';


export default function UploadAudio() {
  const { userId } = useAuth();
  const { setLoading: setGlobalLoading } = useLoading();
  const [tab, setTab] = useState('file');
  const [files, setFiles] = useState([]);
  const [dragOver, setDragOver] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const { notify } = useNotifications();
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
  }

  function onDrop(e) {
    e.preventDefault();
    setDragOver(false);
    const list = Array.from(e.dataTransfer.files || []);
    setFiles(list);
  }

  async function onUploadFiles() {
    try {
      if (!files.length || !userId) return;
      setLoading(true);
      setGlobalLoading(true);
      const res = await AudioUploadAPI.uploadFile(userId, files);
      notify({ type: 'success', message: (typeof res === 'string' ? res : 'Audio files uploaded successfully'), position: 'center' });
      setFiles([]);
    } catch (e) {
      const msg = getErrorMessage(e, 'Failed to upload');
      notify({ type: 'error', message: (isNetworkError(e) ? 'Network error. Please check your connection.' : msg), position: 'center' });
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  }

  async function onUploadUrl() {
    try {
      if (!url.trim() || !userId) return;
      setLoading(true);
      setGlobalLoading(true);
      const res = await AudioUploadAPI.uploadUrl(userId, url.trim());
      notify({ type: 'success', message: (typeof res === 'string' ? res : 'Audio URL uploaded successfully'), position: 'center' });
      setUrl('');
    } catch (e) {
      const msg = getErrorMessage(e, 'Failed to submit URL');
      notify({ type: 'error', message: (isNetworkError(e) ? 'Network error. Please check your connection.' : msg), position: 'center' });
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-xl font-semibold">Upload Audio</div>

      {/* Tabs container looks part of the page */}
      <div className="rounded-2xl glass surface overflow-hidden ambient">
        <div className="relative px-4 pt-3" ref={tabsRef}>
          <div ref={groupRef} className="relative mx-auto w-full max-w-3xl grid grid-cols-2 items-center justify-items-center gap-2">
            <button
              ref={fileBtnRef}
              className={`tab ${tab==='file' ? 'tab-active' : ''}`}
              onClick={() => setTab('file')}
            >
              <Upload size={16} /> Upload Audio
            </button>
            <button
              ref={urlBtnRef}
              className={`tab ${tab==='url' ? 'tab-active' : ''}`}
              onClick={() => setTab('url')}
            >
              <Link2 size={16} /> Upload URL
            </button>
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
                className={`rounded-2xl border p-6 sm:p-8 flex flex-col items-center gap-4 transition-colors ambient ${dragOver? 'border-violet-500 bg-neutral-50 dark:bg-neutral-900/60':'border-neutral-200 dark:border-neutral-800'}`}
              >
                <div className="w-full">
                  <label className="w-full flex items-center justify-between gap-3 border rounded-full px-4 py-2 cursor-pointer hover:border-violet-500 border-neutral-300 dark:border-neutral-700">
                    <span className="text-sm text-neutral-700 dark:text-neutral-300 truncate">{files.length? `${files.length} selected` : 'Choose audio files'}</span>
                    <input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac" className="hidden" multiple onChange={onPick} />
                    <span className="text-xs btn-outline rounded-full px-3 py-1">Browse</span>
                  </label>
                </div>
                {!!files.length && (
                  <ul className="w-full text-sm text-neutral-700 dark:text-neutral-300 space-y-1 max-h-40 overflow-auto">
                    {files.map((f,i)=> (
                      <li key={i} className="flex items-center justify-between gap-3 bg-neutral-100 px-3 py-2 rounded-md dark:bg-neutral-900/50">
                        <span className="truncate">{f.name}</span>
                        <button onClick={()=> setFiles(files.filter((_,x)=>x!==i))} className="text-neutral-500 hover:text-red-600 text-xs dark:text-neutral-400 dark:hover:text-red-400">Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
                <button onClick={onUploadFiles} disabled={!files.length || loading} className="w-full btn-gradient disabled:opacity-60 rounded-md px-4 py-2 text-sm mt-2">
                  {loading? 'Uploading...' : 'Upload'}
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'url' && (
          <div className="p-6 ambient rounded-2xl">
            <div className="max-w-2xl mx-auto space-y-4">
              <input
                value={url}
                onChange={(e)=> setUrl(e.target.value)}
                placeholder="https://example.com/audio.mp3"
                className="w-full input rounded-full focus:ring-2 focus:ring-brand-500"
              />
              <button onClick={onUploadUrl} disabled={!url.trim() || loading} className="w-full btn-gradient disabled:opacity-60 rounded-md px-4 py-2 text-sm">
                {loading? 'Submitting...' : 'Upload'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Notifications are shown via global Toasts */}
    </div>
  );
}

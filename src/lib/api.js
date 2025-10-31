import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://demoapi.callmetrik.com';
const API_KEY = process.env.REACT_APP_API_KEY;
const API_KEY_HEADER = process.env.REACT_APP_API_KEY_HEADER || 'x-api-key';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  if (API_KEY) {
    config.headers[API_KEY_HEADER] = API_KEY;
  }
  return config;
});

// Centralized error normalization
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const cfg = error?.config || {};
    const res = error?.response;
    const payload = {
      message:
        res?.data?.message ||
        res?.data?.error ||
        error?.message ||
        'Request failed',
      status: res?.status,
      code: res?.data?.code || res?.data?.statusCode,
      data: res?.data,
      url: cfg?.url,
      method: cfg?.method,
    };
    const norm = new Error(payload.message);
    Object.assign(norm, payload);
    return Promise.reject(norm);
  }
);

// Small helpers for consumers (optional)
export function getErrorMessage(e, fallback = 'Something went wrong'){
  return e?.message || e?.data?.message || e?.data?.error || fallback;
}
export function isNetworkError(e){
  return !e?.status && (e?.message?.includes('Network Error') || e?.message?.includes('timeout'));
}

export const DashboardAPI = {
  audioKPI: async (userId, params = {}) => {
    const { data } = await api.get(`/v1.3/dashboard/audio-kpi/${userId}`, { params });
    return data;
  },
  datewiseCounts: async (userId, month, year, params = {}) => {
    const { data } = await api.get(`/v1.3/dashboard/getnAudiosByDate/${userId}/${month}/${year}/`, { params });
    return data;
  },
  weekwiseCounts: async (userId, month, year, params = {}) => {
    const { data } = await api.get(`/v1.3/dashboard/getnAudiosByWeek/${userId}/${month}/${year}/`, { params });
    return data;
  },
  monthwiseCounts: async (userId, year, params = {}) => {
    const { data } = await api.get(`/v1.3/dashboard/getnAudiosByMonth/${userId}/${year}`, { params });
    return data;
  },
  sentimentMonthly: async (userId, year, params = {}) => {
    const { data } = await api.get(`/v1.3/dashboard/sentiment_kpi_monthly/${userId}/${year}`, { params });
    return data;
  },
  sentimentWeekly: async (userId, month, year, params = {}) => {
    const { data } = await api.get(`/v1.3/dashboard/sentiment-kpi-weekly/${userId}/${month}/${year}`, { params });
    return data;
  },
  netSentimentScore: async (userId, month) => {
    const { data } = await api.get(`/v1.3/dashboard/netSentimentScore/${userId}/`, { params: { month } });
    return data;
  },
};

// Upload endpoints
export const AudioUploadAPI = {
  // files: FileList | File[] | Blob[]
  uploadFile: async (userId, files) => {
    const form = new FormData();
    const list = Array.from(files || []);
    // backend expects multiple "files" entries
    list.forEach((f) => form.append('files', f));
    const { data } = await api.post(`/v1.3/audio_upload/upload-audio-file/${userId}`,
      form,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    return data;
  },
  // urls: string | string[]
  uploadUrl: async (userId, urls) => {
    const body = { urls: Array.isArray(urls) ? (urls[0] || '') : (urls || '') };
    const { data } = await api.post(`/v1.3/audio_upload/upload-audio-url/${userId}`, body);
    return data;
  },
};

// Audio processing endpoints
export const AudioProcessAPI = {
  process: async (userId, audioIds) => {
    const ids = (Array.isArray(audioIds) ? audioIds : [audioIds]).map((x)=>String(x));
    // Swagger shows raw array body: ["<audioId>"]
    const { data } = await api.post(`/v1.3/audio-process/process/${userId}`, ids);
    return data;
  },
  reAudit: async (userId, audioIds) => {
    const ids = (Array.isArray(audioIds) ? audioIds : [audioIds]).map((x)=>String(x));
    try {
      // 1) Some servers accept raw array
      const { data } = await api.post(`/v1.3/audio-process/reAudit/${userId}`, ids);
      return data;
    } catch (e) {
      try {
        // 2) Others accept object
        const { data } = await api.post(`/v1.3/audio-process/reAudit/${userId}`, { audioIdentifiers: ids });
        return data;
      } catch (e2) {
        // 3) Fallback to empty body
        const { data } = await api.post(`/v1.3/audio-process/reAudit/${userId}`, {});
        return data;
      }
    }
  },
};

export const AudioAPI = {
  monthlySummary: async (userId, year, params = {}) => {
    const { data } = await api.get(`/v1.3/monthlyData/getMonthWiseData/${userId}/${year}/`, { params });
    return data;
  },
  monthRecords: async (userId, month, year, params = {}) => {
    const { data } = await api.get(`/v1.3/audio_records/get-audio-records/${userId}/${month}/${year}`, { params });
    return data;
  },
  recordFilterOptions: async (params = {}) => {
    const { data } = await api.get(`/v1.3/audio_records/get-audio-filter-options`, { params });
    return data;
  },
  audioInsights: async (userId, audioId, params = {}) => {
    const { data } = await api.get(`/v1.3/audio_records/get-audio-insights/${userId}/${audioId}`, { params });
    return data;
  },
  audioPlayerUrl: async (userId, audioId, params = {}) => {
    const { data } = await api.get(`/v1.3/media-player/audio_player/${userId}/${audioId}`, { params });
    return data; // expects a URL string or object with url
  },
  updateManualAudit: async (userId, audioId, responses) => {
    const { data } = await api.post(
      `/v1.3/manualAudit/update-manualAudit/${userId}/`,
      responses,
      { params: { audioId } }
    );
    return data;
  },
};

export const ReportsAPI = {
  cardMetrics: async (userId, params = {}) => {
    const { data } = await api.get(`/v1.3/report/cardMetric/${userId}/`, { params });
    return data;
  },
  callTimeDistribution: async (userId, params = {}) => {
    const { data } = await api.get(`/v1.3/report/callTimeDistribution/${userId}/`, { params });
    return data;
  },
  peakCallHours: async (userId, params = {}) => {
    const { data } = await api.get(`/v1.3/report/peakCallHours/${userId}/`, { params });
    return data;
  },
  callFunnelHtml: async (params = {}) => {
    const { data } = await api.get(`/v1.3/report/callFunnelChartHtml/`, { params, responseType: 'text' });
    return data; // HTML string
  },
  callToLeadConversion: async (userId, params = {}) => {
    const { data } = await api.get(`/v1.3/report/callToLeadConversionRatio/${userId}/`, { params });
    return data;
  },
  eventsByAgent: async (userId, params = {}) => {
    const { data } = await api.get(`/v1.3/report/eventsByAgent/${userId}`, { params });
    return data;
  },
  agentReport: async (userId, params = {}) => {
    const { data } = await api.get(`/v1.3/report/agentReport/${userId}/`, { params });
    return data;
  },
  agentScoreCard: async (userId, params = {}) => {
    const { data } = await api.get(`/v1.3/report/agentScoreCard/${userId}/`, { params });
    return data;
  },
  agentFollowedScript: async (userId, params = {}) => {
    const { data } = await api.get(`/v1.3/report/agentFollowedScript/${userId}`, { params });
    return data;
  },
};

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
    const { data } = await api.post(`/v1.3/manualAudit/update-manualAudit/${userId}/`, responses, {
      params: { audioId },
    });
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

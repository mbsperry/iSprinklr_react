// Replace with your api server address:port

const config = {
    API_SERVER: localStorage.getItem('API_SERVER') || process.env.REACT_APP_ISPRINKLR_API_SERVER || "localhost:8000"
}

export default config;

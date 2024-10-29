import axios from 'axios';

// const jwt = localStorage.getItem('token');

const instance = axios.create({
  baseURL: process.env.REACT_APP_BACKEND || "http://localhost:8080/",
  // headers: {
  //   Authorization: `${jwt}`
  // }
});

export default instance;

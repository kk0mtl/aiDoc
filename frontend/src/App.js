import './App.css';
// import Registration from "./pages/Registration/Registration";
// import Login from "./pages/Login/Login"
import DocumentEditor from "./components/DocumentEditor/DocumentEditor"
// import Dashboard from "./pages/Dashboard/Dashboard"
// import DocumentPage from './pages/DocumentPage/DocumentPage';
import PrivateRoutes from './PrivateRoutes';
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from "react-router-dom"
// import {Fragment} from 'react';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Registration />} /> */}
        <Route element={<PrivateRoutes />}>
          {/* <Route element={<Dashboard />} path="/dashboard" exact></Route> */}
          {/* <Route element={<DocumentEditor/>} path="/documents/:id"></Route> */}
          {/* <Route path="/documents/:id" element={<DocumentPage />} exact></Route> */}
        </Route>
        {/* <Route path="/dashboard/:roomId" element={<Dashboard />} /> */}
        <Route path="/" element={<Go2Document />} />
      </Routes>
    </BrowserRouter>
  );
}

function Go2Document() {
  const query = useQuery();
  const userName = query.get("userName");
  const roomId = query.get("roomId") || "default-room-id"; // Fallback to a default room ID if not provided

  return (
    <DocumentEditor userName={userName} roomId={roomId} />
  );
}


export default App;

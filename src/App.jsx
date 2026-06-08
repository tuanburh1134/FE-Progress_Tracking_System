import { Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import ProjectPage from "./pages/ProjectPage";
import MainLayout from "./Layouts/MainLayout";

export default function App() {
  return (
    <Routes>

      {/* auth */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* dashboard layout */}
      <Route element={<MainLayout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/project" element={<ProjectPage />} />
      </Route>

      <Route path="/" element={<LoginPage />} />

    </Routes>
  );
}
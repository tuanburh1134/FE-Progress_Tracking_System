import { Routes, Route } from "react-router-dom";
import { useState } from "react";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import Dashboard from "./pages/Dashboard";
import ProjectPage from "./pages/ProjectPage";
import ProjectDetailPage from "./pages/ProjectDetailPage";
import TrashProjectPage from "./pages/TrashProjectPage";
import MainLayout from "./Layouts/MainLayout";
import TeamPage from "./pages/TeamPage";
import SettingPage from "./pages/SettingPage";
import ProfilePage from "./pages/ProfilePage";

export default function App() {
  const [projectList, setProjectList] = useState([]);

  return (
    <Routes>

      {/* AUTH */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* MAIN LAYOUT */}
      <Route element={<MainLayout />}>

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/settings" element={<SettingPage />} />

        {/* PROJECT LIST */}
        <Route
          path="/project"
          element={
            <ProjectPage
              projectList={projectList}
              setProjectList={setProjectList}
            />
          }
        />

        {/* THÙNG RÁC */}
        <Route
          path="/projects/trash"
          element={<TrashProjectPage />}
        />

        {/* PROJECT DETAIL */}
        <Route
          path="/project/:id"
          element={
            <ProjectDetailPage
              projectList={projectList}
              updateProject={(id, newTasks) => {
                setProjectList((prev) =>
                  prev.map((p) =>
                    p.id === id
                      ? { ...p, tasks: newTasks }
                      : p
                  )
                );
              }}
            />
          }
        />

      </Route>

      {/* DEFAULT */}
      <Route path="/" element={<LoginPage />} />

    </Routes>
  );
}
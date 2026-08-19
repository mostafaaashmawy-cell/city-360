'use client';

import React from 'react';
import { useSettings } from '@/context/SettingsContext';
import { Layers, Plus, Building2, ExternalLink } from 'lucide-react';
import Link from 'next/link';

interface ProjectTabBarProps {
  selectedProjectId: string; // 'all' or specific project ID
  onSelectProject: (projectId: string) => void;
  leadCountsByProject?: Record<string, number>;
  showNewProjectButton?: boolean;
}

export default function ProjectTabBar({
  selectedProjectId,
  onSelectProject,
  leadCountsByProject = {},
  showNewProjectButton = true,
}: ProjectTabBarProps) {
  const { projects } = useSettings();

  const totalAllCount = Object.values(leadCountsByProject).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full overflow-x-auto pb-1 scrollbar-thin">
      <div className="flex items-center gap-1.5 border-b border-white/10 px-1 py-1 min-w-max">
        {/* 'All Projects' Tab */}
        <button
          type="button"
          onClick={() => onSelectProject('all')}
          className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all select-none ${
            selectedProjectId === 'all'
              ? 'bg-white/10 text-white border-t-2 border-indigo-400 shadow-md'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
          style={
            selectedProjectId === 'all'
              ? {
                  background:
                    'linear-gradient(180deg, rgba(99,102,241,0.2) 0%, rgba(15,15,25,0.9) 100%)',
                  borderLeft: '1px solid rgba(255,255,255,0.08)',
                  borderRight: '1px solid rgba(255,255,255,0.08)',
                }
              : {}
          }
        >
          <Layers className="w-3.5 h-3.5 text-indigo-400" />
          <span>All Projects</span>
          {totalAllCount > 0 && (
            <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {totalAllCount}
            </span>
          )}
        </button>

        {/* Dynamic Project Tabs (Automatically created for every project!) */}
        {projects.map((project) => {
          const isSelected = selectedProjectId === project.id;
          const count = leadCountsByProject[project.id] ?? 0;

          return (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelectProject(project.id)}
              className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-semibold transition-all select-none ${
                isSelected
                  ? 'bg-white/10 text-white border-t-2 border-cyan-400 shadow-md'
                  : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
              style={
                isSelected
                  ? {
                      background:
                        'linear-gradient(180deg, rgba(6,182,212,0.2) 0%, rgba(15,15,25,0.9) 100%)',
                      borderLeft: '1px solid rgba(255,255,255,0.08)',
                      borderRight: '1px solid rgba(255,255,255,0.08)',
                    }
                  : {}
              }
            >
              {/* Active/Inactive Status Dot */}
              <span
                className={`w-2 h-2 rounded-full ${
                  project.is_active ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50' : 'bg-rose-400/60'
                }`}
                title={project.is_active ? 'Public Preview Active' : 'Public Preview Offline'}
              />

              <Building2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>{project.project_name}</span>

              {/* Lead count badge if provided */}
              {count > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {count}
                </span>
              )}
            </button>
          );
        })}

        {/* Quick '+ New Project' Tab Action */}
        {showNewProjectButton && (
          <Link
            href="/admin/settings?action=new"
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white/40 hover:text-white hover:bg-white/5 rounded-t-xl transition-all border border-dashed border-white/10 hover:border-white/25 ml-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Tab</span>
          </Link>
        )}
      </div>
    </div>
  );
}

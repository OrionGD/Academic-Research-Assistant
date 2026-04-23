import React, { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  Calendar, 
  Users, 
  Plus, 
  MoreHorizontal,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { Project } from '../../../types/api';
import { adminEnterpriseService } from '../../services/api/adminEnterpriseService';
import { formatDate } from '../../../utils/helpers';
import { toast } from 'sonner';

export default function AdminProjectsTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    try {
      const data = await adminEnterpriseService.getProjects();
      setProjects(data);
    } catch (e) {
      toast.error('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'ongoing': return 'text-gold-main bg-gold-main/10 border-gold-main/20';
      case 'completed': return 'text-green-500 bg-green-500/10 border-green-500/20';
      case 'on-hold': return 'text-red-400 bg-red-400/10 border-red-400/20';
      default: return 'text-text-muted bg-bg-elevated border-silver-muted/20';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-text-primary tracking-tight">Project Oversight</h3>
          <p className="text-sm text-text-secondary mt-1">Monitor research progress and supervisor assignments.</p>
        </div>
        <button className="flex items-center gap-2 px-5 py-2.5 bg-gold-main text-bg-main text-xs font-black rounded-xl hover:bg-gold-hover transition-all shadow-lg shadow-gold-main/20 uppercase tracking-widest">
          <Plus size={16} /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-text-muted">
            <Clock className="animate-spin mb-4" size={32} />
            <p className="text-sm font-bold uppercase tracking-widest">Loading Projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div className="py-20 bg-bg-secondary rounded-[32px] border border-dashed border-silver-muted/20 flex flex-col items-center justify-center text-center">
            <FolderKanban size={48} className="text-text-muted mb-4 opacity-20" />
            <h4 className="text-lg font-bold text-text-primary">No Active Projects</h4>
            <p className="text-sm text-text-secondary mt-1 max-w-sm">Create your first research project to start tracking milestones and collaborators.</p>
          </div>
        ) : (
          projects.map((project) => (
            <div key={project.id} className="bg-bg-secondary rounded-3xl border border-silver-muted/20 shadow-xl metallic-card overflow-hidden transition-all hover:border-gold-main/20 group">
              <div className="p-8 flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-1 text-[10px] font-black rounded-lg border uppercase tracking-widest ${getStatusColor(project.status)}`}>
                      {project.status}
                    </span>
                    <h4 className="text-xl font-bold text-text-primary group-hover:text-gold-main transition-colors">{project.name}</h4>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed line-clamp-2">
                    {project.description}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <div className="flex items-center gap-2">
                      <Users size={16} className="text-text-muted" />
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                        {project.supervisors.length} Supervisors
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={16} className="text-text-muted" />
                      <span className="text-xs font-bold text-text-muted uppercase tracking-widest">
                        {project.milestones.length} Milestones
                      </span>
                    </div>
                  </div>
                </div>

                <div className="lg:w-72 space-y-4">
                  <div className="bg-bg-elevated/30 p-4 rounded-2xl border border-silver-muted/10">
                    <h5 className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] mb-3">Milestone Progress</h5>
                    <div className="space-y-2">
                      {project.milestones.slice(0, 3).map((m, i) => (
                        <div key={i} className="flex items-center justify-between gap-3">
                          <span className={`text-[11px] font-medium truncate ${m.completed ? 'text-text-muted line-through' : 'text-text-primary'}`}>
                            {m.title}
                          </span>
                          {m.completed ? (
                            <CheckCircle2 size={14} className="text-green-500 shrink-0" />
                          ) : (
                            <div className="w-3.5 h-3.5 rounded-full border border-silver-muted/30 shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <button className="w-full py-3 text-[10px] font-black text-gold-main hover:text-gold-hover flex items-center justify-center gap-2 uppercase tracking-[0.15em] border border-gold-main/10 rounded-xl hover:bg-gold-main/5 transition-all">
                    View Project Details
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

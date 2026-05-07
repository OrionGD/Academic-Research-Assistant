import sys

with open('e:/PROJECTS/ARAS/frontend/src/landingpage/HomePage.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_content = []
skip = False
for i, line in enumerate(lines):
    if '<div className="space-y-24">' in line and 170 < i < 185:
        skip = True
        new_content.append('''          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* AI Document Analysis - Spans 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="md:col-span-2 blackbox-card flex flex-col overflow-hidden"
            >
              <div className="terminal-header">
                <div className="terminal-dot terminal-dot-red"></div>
                <div className="terminal-dot terminal-dot-yellow"></div>
                <div className="terminal-dot terminal-dot-green"></div>
                <span className="ml-2 text-xs text-text-muted font-mono">document_analysis.py</span>
              </div>
              <div className="p-8 flex flex-col lg:flex-row gap-8 items-center h-full">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-bg-primary border border-border-main rounded-xl flex items-center justify-center text-feature-blue mb-5">
                    <FileText size={24} />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-3 tracking-tighter">AI Document Analysis</h3>
                  <p className="text-text-secondary text-sm leading-relaxed mb-6">
                    Upload any research paper and instantly receive a structured breakdown — saving hours of manual reading.
                  </p>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {['Comprehensive summary','Key insights & contributions','Methodology breakdown','Results interpretation'].map((item, i) => (
                      <li key={i} className="flex items-center gap-3 text-text-secondary text-sm font-medium">
                        <CheckCircle2 className="text-status-success flex-shrink-0" size={14} />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex-1 bg-code-bg rounded-xl p-5 border border-code-border w-full font-mono text-xs text-accent-light shadow-inner overflow-hidden">
                  <div className="text-purple-400 mb-2">import <span className="text-white">aras_ai</span></div>
                  <div className="text-blue-400 mb-2">async def <span className="text-white">analyze_paper</span>(pdf_path):</div>
                  <div className="pl-4 text-text-secondary mb-2"># Extract text, tables, and methodology</div>
                  <div className="pl-4 mb-2">doc = <span className="text-purple-400">await</span> aras_ai.parse(pdf_path)</div>
                  <div className="pl-4 mb-2">insights = <span className="text-purple-400">await</span> doc.generate_insights()</div>
                  <div className="pl-4 text-green-400">return <span className="text-white">insights</span></div>
                </div>
              </div>
            </motion.div>

            {/* Semantic Research Search */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="blackbox-card p-8 flex flex-col"
            >
              <div className="w-12 h-12 bg-bg-primary border border-border-main rounded-xl flex items-center justify-center text-feature-teal mb-5">
                <Search size={24} />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3 tracking-tighter">Semantic Search</h3>
              <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-1">
                Vector embeddings and cosine similarity to understand meaning, not just words. Ranked by relevance score across your entire library in under 1 second.
              </p>
              <div className="bg-bg-primary p-4 rounded-xl border border-border-main">
                <div className="flex items-center gap-2 mb-3 text-text-muted text-xs">
                  <Search size={12} />
                  <span>transformer architectures</span>
                </div>
                <div className="space-y-2">
                  <div className="h-1.5 w-full bg-accent rounded-full opacity-80"></div>
                  <div className="h-1.5 w-4/5 bg-accent rounded-full opacity-50"></div>
                  <div className="h-1.5 w-3/5 bg-accent rounded-full opacity-30"></div>
                </div>
              </div>
            </motion.div>

            {/* AI Research Chat */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="blackbox-card flex flex-col overflow-hidden"
            >
              <div className="terminal-header">
                <div className="terminal-dot terminal-dot-red"></div>
                <div className="terminal-dot terminal-dot-yellow"></div>
                <div className="terminal-dot terminal-dot-green"></div>
                <span className="ml-2 text-xs text-text-muted font-mono">chat_session.sh</span>
              </div>
              <div className="p-8 flex flex-col h-full">
                <div className="w-12 h-12 bg-bg-primary border border-border-main rounded-xl flex items-center justify-center text-feature-violet mb-5">
                  <MessageSquare size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tighter">AI Research Chat</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-6 flex-1">
                  Ask complex questions and receive contextual answers sourced directly from your uploaded papers, with page-level citations.
                </p>
                <div className="space-y-3 font-mono text-[10px]">
                  <div className="flex items-start gap-2">
                    <span className="text-accent font-bold">&gt;</span>
                    <span className="text-text-primary">How does it handle class imbalance?</span>
                  </div>
                  <div className="flex items-start gap-2 pl-4">
                    <span className="text-success font-bold">[RAG]</span>
                    <span className="text-text-secondary">Authors used SMOTE oversampling [Page 14, §3.2].</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Cross-Paper Comparison - Spans 2 cols */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="md:col-span-2 blackbox-card p-8 flex flex-col md:flex-row gap-8 items-center"
            >
              <div className="flex-1">
                <div className="w-12 h-12 bg-bg-primary border border-border-main rounded-xl flex items-center justify-center text-feature-amber mb-5">
                  <GitCompare size={24} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3 tracking-tighter">Cross-Paper Comparison</h3>
                <p className="text-text-secondary text-sm leading-relaxed mb-6">
                  Compare multiple research papers side-by-side with AI-generated comparative analysis highlighting shared methodologies, conflicting findings, and novel opportunities.
                </p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-bg-primary border border-border-main rounded-lg text-xs font-medium text-white">
                  <GitCompare size={14} className="text-accent-light" />
                  Dramatically accelerates literature review
                </div>
              </div>
              <div className="flex-1 w-full bg-bg-primary rounded-xl border border-border-main p-4 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-accent/5 to-transparent shimmer"></div>
                <div className="flex items-center justify-between mb-4 relative z-10">
                  <div className="text-xs font-bold text-text-primary">Paper A</div>
                  <div className="text-xs text-text-muted">vs</div>
                  <div className="text-xs font-bold text-text-primary">Paper B</div>
                </div>
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-border-main rounded-full"></div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider w-16 text-center">Method</div>
                    <div className="h-1.5 flex-1 bg-accent/40 rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-border-main rounded-full"></div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider w-16 text-center">Dataset</div>
                    <div className="h-1.5 flex-1 bg-border-main rounded-full"></div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 flex-1 bg-success/40 rounded-full"></div>
                    <div className="text-[10px] text-text-muted uppercase tracking-wider w-16 text-center">Accuracy</div>
                    <div className="h-1.5 flex-1 bg-border-main rounded-full"></div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>\n''')
    elif skip and '        </div>' in line and '      </section>' in lines[i+1] and 330 < i < 335:
        skip = False
        new_content.append(line)
    elif not skip:
        new_content.append(line)

with open('e:/PROJECTS/ARAS/frontend/src/landingpage/HomePage.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_content)

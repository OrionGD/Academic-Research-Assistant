import { Link } from 'react-router-dom';
import { GraduationCap, ArrowLeft, Mail, MessageCircle, HelpCircle, FileQuestion, Globe, Clock } from 'lucide-react';
import { motion } from 'motion/react';

const faqs = [
  {
    question: 'What file formats are supported?',
    answer: 'Currently, we support PDF files up to 50MB. We are working on adding support for Word documents and LaTeX files in the near future.'
  },
  {
    question: 'How secure is my research data?',
    answer: 'Your data is encrypted both in transit and at rest. We use Firebase for secure authentication and follow industry best practices for data isolation.'
  },
  {
    question: 'Can I share my library with colleagues?',
    answer: 'Yes, our Enterprise and Team plans allow for shared libraries and collaborative AI chat sessions.'
  },
  {
    question: 'What AI models do you use?',
    answer: 'We leverage Google Gemini models for document analysis and conversational AI, combined with our proprietary vector indexing technology.'
  }
];

export default function SupportPage() {
  return (
    <div className="min-h-screen bg-bg-dark font-sans text-text-primary">
      {/* Header */}
      <header className="bg-surface-dark border-b border-surface-light sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-10 h-10 bg-accent-primary rounded-xl flex items-center justify-center text-bg-dark shadow-lg shadow-accent-primary/20 group-hover:scale-105 transition-transform">
              <GraduationCap size={24} />
            </div>
            <span className="font-bold text-2xl tracking-tight text-text-primary">ScholarAI</span>
          </Link>
          <Link to="/" className="flex items-center gap-2 text-text-secondary hover:text-accent-primary font-medium transition-colors">
            <ArrowLeft size={20} />
            Back to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-16">
        <div className="text-center mb-20">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-4xl md:text-5xl font-bold text-text-primary mb-6 tracking-tight">How can we help?</h1>
            <p className="text-xl text-text-secondary max-w-2xl mx-auto">
              Our support team is here to help you get the most out of ScholarAI. Choose a contact method below or browse our FAQs.
            </p>
          </motion.div>
        </div>

        {/* Contact Methods */}
        <div className="grid md:grid-cols-3 gap-8 mb-32">
          {[
            { title: 'Email Support', desc: 'Get a response within 24 hours.', icon: Mail, action: 'Email Us', link: 'mailto:support@scholarai.example' },
            { title: 'Live Chat', desc: 'Available Mon-Fri, 9am-5pm EST.', icon: MessageCircle, action: 'Start Chat', link: '#' },
            { title: 'Community', desc: 'Join our researcher community.', icon: Globe, action: 'Join Forum', link: '#' },
          ].map((item, i) => (
            <div key={i} className="bg-surface-dark p-10 rounded-[2.5rem] border border-surface-light shadow-lg text-center flex flex-col items-center hover:border-accent-primary/30 transition-all group">
              <div className="w-16 h-16 bg-accent-primary/10 rounded-2xl flex items-center justify-center text-accent-primary mb-8 border border-accent-primary/20 group-hover:bg-accent-primary/20 transition-colors">
                <item.icon size={32} />
              </div>
              <h3 className="text-xl font-bold text-text-primary mb-4">{item.title}</h3>
              <p className="text-text-secondary mb-8 font-medium">{item.desc}</p>
              <a 
                href={item.link}
                className="w-full bg-accent-primary text-bg-dark py-4 rounded-2xl font-bold hover:bg-accent-highlight transition-all shadow-lg shadow-accent-primary/20"
              >
                {item.action}
              </a>
            </div>
          ))}
        </div>

        {/* FAQs */}
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-12 justify-center">
            <div className="w-12 h-12 bg-accent-primary/10 rounded-xl flex items-center justify-center text-accent-primary border border-accent-primary/20">
              <HelpCircle size={28} />
            </div>
            <h2 className="text-3xl font-bold text-text-primary tracking-tight">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            {faqs.map((faq, i) => (
              <div key={i} className="bg-surface-dark rounded-3xl p-8 border border-surface-light shadow-lg hover:border-accent-primary/20 transition-all">
                <h3 className="text-lg font-bold text-text-primary mb-4 flex gap-3">
                  <FileQuestion className="text-accent-primary shrink-0" size={24} />
                  {faq.question}
                </h3>
                <p className="text-text-secondary leading-relaxed pl-9">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Support Hours */}
        <div className="mt-32 bg-surface-dark rounded-[2.5rem] p-12 border border-surface-light text-text-primary flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-surface-medium rounded-2xl flex items-center justify-center text-accent-primary border border-surface-light">
              <Clock size={32} />
            </div>
            <div>
              <h4 className="text-xl font-bold mb-2">Support Hours</h4>
              <p className="text-text-secondary">Monday — Friday, 9:00 AM — 5:00 PM EST</p>
            </div>
          </div>
          <div className="text-text-secondary font-medium">
            Current status: <span className="text-accent-primary font-bold">All Systems Operational</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-surface-dark border-t border-surface-light py-12">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-text-secondary font-medium">© 2026 ScholarAI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

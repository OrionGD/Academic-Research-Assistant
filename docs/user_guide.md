# **📖 ARAS User Guide**
*Academic Research Assistant System*

---

## **🌟 Welcome to ARAS!**

ARAS (Academic Research Assistant System) is an intelligent research companion that helps you:
- 📚 **Upload and organize** research papers
- 🔍 **Search intelligently** across your document collection
- 🤖 **Ask questions** about your papers in natural language
- 📊 **Extract insights** and find connections between papers
- 🎯 **Stay organized** with smart categorization and tagging

---

## **🚀 Getting Started**

### **1. Create Your Account**
**Option A: Email Registration**
1. Click "Sign Up" on the homepage
2. Enter your email and create a password
3. Verify your email (check your inbox)
4. Complete your profile with name and institution

**Option B: Google Sign-In**
1. Click "Sign in with Google"
2. Select your Google account
3. Grant necessary permissions
4. You're ready to go!

### **2. Set Up Your Profile**
Navigate to **Profile → Settings** to:
- Add your academic affiliation
- Set research interests/topics
- Configure notification preferences
- Choose your preferred language

---

## **📁 Document Management**

### **Uploading Documents**
#### **Single Upload**
1. Click **"Upload"** button in the Documents section
2. Drag & drop PDF/DOCX/TXT files or click to browse
3. Add metadata (optional):
   - Title
   - Authors
   - Publication year
   - Keywords
   - Abstract
4. Click **"Process"** - ARAS will:
   - Extract text and structure
   - Identify citations and references
   - Create searchable chunks
   - Generate embeddings for semantic search

#### **Batch Upload**
1. Click **"Bulk Upload"**
2. Select multiple files (up to 50 at once)
3. Choose processing priority:
   - **Standard**: Process in background
   - **Priority**: Process immediately
4. Monitor progress in the **Uploads Queue**

### **Supported Formats**
| Format | Features | Max Size |
|--------|----------|----------|
| PDF | Full text, citations, figures, equations | 50MB |
| DOCX | Text, formatting, tables | 25MB |
| TXT | Plain text with UTF-8 encoding | 10MB |
| MD | Markdown with formatting | 5MB |

### **Organizing Documents**
#### **Folders & Collections**
```markdown
📁 My Research/
├── 📁 Machine Learning/
│   ├── 📁 Transformers/
│   └── 📁 GANs/
├── 📁 Computer Vision/
└── 📁 Conference Papers/
```

**Create Collections:**
1. Click **"New Collection"**
2. Name your collection (e.g., "CVPR 2023 Papers")
3. Add description and tags
4. Drag documents into collection

#### **Smart Tags**
ARAS automatically tags documents based on:
- 🏷️ **Content**: Machine Learning, NLP, CV, etc.
- 🏷️ **Publication Type**: Journal, Conference, Preprint
- 🏷️ **Year**: 2023, 2022, etc.
- 🏷️ **Status**: Read, Unread, Important

**Add Custom Tags:**
1. Open document details
2. Click **"Add Tag"**
3. Type tag name or select from suggestions
4. Press Enter to save

### **Document Actions**
| Action | How To | Use Case |
|--------|--------|----------|
| View | Click document title | Read full document |
| Preview | Hover + click eye icon | Quick preview |
| Download | Click download button | Save locally |
| Share | Click share icon | Share with collaborators |
| Delete | Click trash icon | Remove from library |
| Export | Menu → Export | Export as JSON/CSV |

---

## **🔍 Intelligent Search**

### **Basic Search**
1. Type keywords in the search bar
2. Press Enter or click search icon
3. Results show:
   - 📄 **Relevant documents** with highlighted matches
   - 📑 **Matching sections** within documents
   - 🔢 **Relevance scores** (0-100%)

### **Advanced Search Filters**
```yaml
Search: "transformer architecture"
Filters:
  - Document Type: Conference Paper
  - Year: 2020-2023
  - Authors: "Vaswani"
  - Has: Equations
  - Citations: >100
  - My Tags: "Important"
```

#### **Filter Categories:**
- **Content Type**: Paper, Book, Thesis, etc.
- **Publication Venue**: CVPR, NeurIPS, ACL, etc.
- **Date Range**: Specific years or date ranges
- **Authors**: Single or multiple authors
- **Citations**: Minimum citation count
- **My Ratings**: Star ratings you've given
- **File Type**: PDF, DOCX, TXT

### **Semantic Search**
**Find conceptually similar papers:**
```
Search: "Papers about attention mechanism improvements"
→ Returns documents discussing:
   - Multi-head attention variants
   - Sparse attention methods
   - Efficient transformer architectures
   - Attention visualization techniques
```

**Features:**
- ✅ Understands research concepts
- ✅ Finds related papers even without keyword matches
- ✅ Groups similar papers together
- ✅ Shows conceptual relationships

### **Hybrid Search**
Combines keyword matching with semantic understanding:

```python
# Example: Finding papers about "efficient transformers"
Results = 
  Keyword("efficient transformers") + 
  Semantic("model compression attention optimization") +
  Filter(year >= 2020)
```

### **Search Tips**
| Tip | Example | Result |
|-----|---------|--------|
| Use quotes | `"BERT model"` | Exact phrase |
| Boolean AND | `transformer AND attention` | Both terms |
| Boolean OR | `ViT OR vision-transformer` | Either term |
| Exclude | `transformer -electrical` | Excludes term |
| Wildcard | `transform*` | Transformer, transformers |
| Field search | `author:"Vaswani"` | Specific author |

---

## **💬 Research Assistant Chat**

### **Starting a Conversation**
1. Go to **Chat** section
2. Type your question about any document
3. ARAS will:
   - Find relevant sections
   - Generate comprehensive answer
   - Cite sources with page numbers
   - Suggest follow-up questions

### **Question Examples**

#### **Basic Questions:**
```
"What is the main contribution of this paper?"
"Summarize the methodology section."
"What datasets were used?"
"What are the limitations mentioned?"
```

#### **Comparative Questions:**
```
"How does this approach compare to BERT?"
"What are the differences between methods A and B?"
"Which paper has better results on this benchmark?"
```

#### **Analytical Questions:**
```
"What assumptions does this paper make?"
"How could this method be improved?"
"What are the ethical implications?"
"Explain Figure 3 in simple terms."
```

#### **Technical Questions:**
```
"What is the mathematical formulation of equation 5?"
"How is the loss function computed?"
"What hyperparameters were used?"
"Explain the architecture in detail."
```

### **Chat Features**

#### **Multi-Document Queries**
```
"Across all my papers about GANs, 
what are the most common evaluation metrics?"
```

ARAS will:
1. Search across all GAN-related papers
2. Extract evaluation metrics from each
3. Compile comprehensive list
4. Show usage frequency

#### **Citation Tracking**
Every answer includes:
> 📚 **Sources:**
> - Paper A, pages 3-5 (Relevance: 92%)
> - Paper B, pages 8-10 (Relevance: 87%)
> - Paper C, pages 12-15 (Relevance: 78%)

Click citations to:
- Jump to source page
- View context around citation
- See related citations

#### **Conversation History**
- All chats are saved automatically
- Continue conversations days later
- Export chat history
- Mark important conversations

#### **Chat Commands**
| Command | Description | Example |
|---------|-------------|---------|
| `/summarize` | Summarize document | `/summarize paper.pdf` |
| `/compare` | Compare two papers | `/compare paper1.pdf paper2.pdf` |
| `/find` | Find specific info | `/find ablation studies` |
| `/clear` | Clear chat history | `/clear` |
| `/export` | Export conversation | `/export pdf` |

---

## **📊 Document Analysis**

### **Paper Insights Dashboard**
Access via: **Document → Insights**

**Shows:**
- 📈 **Readability Score**: How complex is the paper?
- 🎯 **Key Contributions**: Main points extracted
- 🔗 **Citation Network**: Papers citing/cited by this
- 📝 **Methodology Summary**: Techniques used
- 📊 **Results Summary**: Main findings

### **Citation Explorer**
1. Click **"Citations"** tab on any document
2. View:
   - **Incoming**: Papers citing this one
   - **Outgoing**: Papers cited by this one
   - **Citation Graph**: Visual relationship map
   - **Citation Context**: How this paper is cited

### **Research Trends**
**Discover patterns in your library:**
- 📅 **Publication timeline** of topics
- 👥 **Author collaboration networks**
- 🔄 **Concept evolution** over time
- 📈 **Popularity trends** of methods

---

## **🤝 Collaboration Features**

### **Shared Collections**
1. Create collection
2. Click **"Share"**
3. Choose collaborators
4. Set permissions:
   - **View only**: Can read
   - **Comment**: Can add notes
   - **Edit**: Can add/remove papers
   - **Admin**: Full control

### **Annotations & Notes**
#### **Personal Notes**
- Highlight text and click **"Add Note"**
- Add private thoughts or reminders
- Tag notes for organization
- Search across all notes

#### **Shared Comments**
- Highlight text and click **"Comment"**
- @mention collaborators
- Start discussions
- Resolve comments when addressed

### **Research Groups**
Create groups for:
- 👥 **Lab members**
- 📚 **Course students**
- 🤝 **Collaboration projects**
- 🎯 **Reading clubs**

**Group features:**
- Shared document library
- Group chat/discussions
- Collaborative annotations
- Progress tracking

---

## **⚡ Productivity Tips**

### **Keyboard Shortcuts**
| Shortcut | Action | Where |
|----------|--------|-------|
| `Ctrl/Cmd + F` | Search in document | Document view |
| `Ctrl/Cmd + S` | Save search | Search page |
| `Ctrl/Cmd + N` | New note | Anywhere |
| `Ctrl/Cmd + U` | Upload document | Documents page |
| `Ctrl/Cmd + L` | Toggle sidebar | Global |
| `Esc` | Close modal | Anywhere |

### **Quick Actions**
1. **Drag & drop** files anywhere to upload
2. **Right-click** documents for quick menu
3. **Double-click** tags to filter by them
4. **Middle-click** opens in new tab

### **Automation Rules**
Create rules to auto-organize:
```yaml
Rule: Auto-tag by topic
When: New document added
If: Contains "transformer" in abstract
Then: Add tags ["NLP", "Transformers"]

Rule: Move to folder
When: Paper published
If: Venue is "CVPR"
Then: Move to "CVPR Papers" collection
```

---

## **🔔 Notifications & Alerts**

### **Notification Types**
| Type | Trigger | Action |
|------|---------|--------|
| 📬 **Upload Complete** | Document processed | View document |
| 🔔 **Mention** | Someone @mentions you | View comment |
| 📅 **Reminder** | Scheduled paper review | Mark as read |
| 📊 **Weekly Digest** | Weekly summary | View insights |
| 🎯 **Recommendations** | New relevant papers | Add to library |

### **Configure Notifications**
**Settings → Notifications:**
- Email frequency: Instant/Daily/Weekly
- Desktop notifications: On/Off
- Mobile push: On/Off
- Sound alerts: On/Off

---

## **📱 Mobile Experience**

### **Mobile App Features**
- 📸 **Scan documents** with camera
- 🎤 **Voice queries** to chat
- 📍 **Location-based** paper suggestions
- 🔄 **Offline access** to saved papers
- 📲 **Push notifications** for updates

### **Mobile-Optimized Views**
- 📄 **Reader mode** for comfortable reading
- 👆 **Touch-optimized** navigation
- 📱 **Responsive** document viewer
- 🖼️ **Thumbnail grids** for browsing

---

## **🔒 Privacy & Security**

### **Your Data**
- 📍 **Location**: Stored in your chosen region
- 🔐 **Encryption**: End-to-end encryption for documents
- 🗑️ **Deletion**: Full control to delete your data
- 📋 **Export**: Export all your data anytime

### **Sharing Controls**
| Level | What's shared | With whom |
|-------|--------------|-----------|
| Private | Only you | No one else |
| Shared | Documents + notes | Selected collaborators |
| Public | Documents only | Anyone with link |
| Anonymous | Aggregated data | Research community |

### **Security Features**
- 🔐 **Two-factor authentication**
- 📱 **Login alerts** for new devices
- 📊 **Access logs** showing who accessed what
- 🚨 **Suspicious activity** alerts

---

## **🛠️ Advanced Features**

### **API Access**
**For developers/researchers:**
```python
import aras

# Initialize client
client = aras.Client(api_key="your_key")

# Search documents
results = client.search(
    query="attention mechanisms",
    filters={"year": "2020-2023"}
)

# Process document
doc = client.process_document(
    file_path="paper.pdf",
    extract_citations=True,
    generate_summary=True
)
```

**Available endpoints:**
- `/api/v1/search` - Advanced search
- `/api/v1/documents` - Document management
- `/api/v1/chat` - Programmatic Q&A
- `/api/v1/analytics` - Research analytics

### **Custom Models**
**Train on your research domain:**
1. Upload domain-specific papers
2. Click **"Train Custom Model"**
3. Choose training parameters
4. Monitor training progress
5. Deploy for your organization

### **Integration Options**
| Platform | Integration | Use Case |
|----------|-------------|----------|
| Zotero | Sync library | Reference management |
| Overleaf | Direct import | Paper writing |
| Google Drive | Cloud storage | Document backup |
| Slack/Teams | Notifications | Team collaboration |
| Calendar | Reading schedule | Time management |

---

## **❓ Frequently Asked Questions**

### **General Questions**
**Q: Is there a limit to how many documents I can upload?**
A: Free tier: 100 documents, 1GB storage. Pro tier: Unlimited documents, 50GB storage.

**Q: Can I use ARAS offline?**
A: Yes! Premium users can download papers and chat history for offline access.

**Q: How accurate is the semantic search?**
A: Typically 85-95% accurate for research papers, depending on document quality.

### **Technical Questions**
**Q: What languages are supported?**
A: Currently English, with experimental support for Chinese, Spanish, and German.

**Q: Can I upload scanned PDFs?**
A: Yes! ARAS uses OCR to extract text from scanned documents.

**Q: How are citations extracted?**
A: Using advanced NLP models trained on academic citation patterns.

### **Privacy Questions**
**Q: Who can see my uploaded papers?**
A: Only you and people you explicitly share with. We don't share your data.

**Q: Can I delete my data permanently?**
A: Yes, go to Settings → Privacy → Delete All Data.

**Q: Is my data used for training?**
A: Only with explicit opt-in for research improvement.

---
<!--
## **📞 Support & Resources**

### **Getting Help**
1. **In-app Help**: Click ❓ in bottom right
2. **Documentation**: [docs.aras.ai](https://docs.aras.ai)
3. **Email**: support@aras.ai
4. **Community**: [community.aras.ai](https://community.aras.ai)

### **Learning Resources**
- 🎓 **Tutorial Videos**: Getting started guides
- 📚 **Use Cases**: Research scenarios and examples
- 🛠️ **API Documentation**: Developer guides
- 📊 **Best Practices**: Research workflow optimization
-->
### **Feedback & Suggestions**
We love hearing from users!
- **Feature requests**: [features.aras.ai](https://features.aras.ai)
- **Bug reports**: Click "Report Issue" in app
- **Survey**: Help shape future features

---

## **🎯 Pro Tips for Researchers**

### **Workflow Optimization**
1. **Morning routine**: Check ARAS digest for new relevant papers
2. **Reading sessions**: Use chat to quickly understand key points
3. **Writing papers**: Find related work and citations quickly
4. **Lab meetings**: Share collections and discuss findings
5. **Literature review**: Let ARAS help identify key papers and trends

### **Research Scenarios**
#### **Scenario 1: Starting a New Project**
```
1. Create collection for project
2. Upload foundational papers
3. Ask: "What are the main approaches in this field?"
4. Create reading list from recommendations
5. Set up alerts for new papers
```

#### **Scenario 2: Writing a Paper**
```
1. Search for related work
2. Extract key citations
3. Compare your method with others
4. Find evaluation metrics
5. Generate related work section draft
```

#### **Scenario 3: Preparing for Review**
```
1. Upload paper draft
2. Ask: "What related work am I missing?"
3. Check citation completeness
4. Verify methodology descriptions
5. Prepare rebuttal material
```

---

## **✨ Final Notes**

ARAS is designed to **augment** your research process, not replace it. The best results come from combining AI assistance with your expert knowledge.

### **Remember:**
- ✅ **Verify** important information
- ✅ **Cross-check** citations
- ✅ **Use** as starting point for deeper exploration
- ✅ **Provide** feedback to improve the system

### **Happy researching!** 🎓🔬

*Last updated: Version 1.0.0*
*Need help? Contact support@aras.ai*

---

## **📱 Quick Reference Card**

### **Essential Actions**
| Goal | Action |
|------|--------|
| Find papers | Search bar + filters |
| Understand paper | Chat with document |
| Organize | Create collections |
| Collaborate | Share collection |
| Stay updated | Set up alerts |
| Export data | Settings → Export |

### **Common Questions**
| Question | Where to ask |
|----------|-------------|
| Paper summary | Chat: "Summarize this paper" |
| Find similar | Right-click → Find Similar |
| Compare papers | Select 2+ → Compare |
| Reading list | Collection → Export as List |
| Progress | Dashboard → Statistics |

---

**ARAS Team** 🤖❤️📚
*Empowering research, one paper at a time*

import React, { useState, useEffect } from 'react';

const API_BASE = 'http://localhost:5000/api';

const AdminPanel = ({ onBack }) => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/students`)
      .then(res => res.json())
      .then(data => {
        setStudents(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch students:', err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div style={{padding:'100px', textAlign:'center'}}>Loading admin data...</div>;

  return (
    <div className="admin-panel">
      <div className="wrap">
        <div className="admin-header">
          <h1 className="admin-title">Waitlist Records</h1>
          <div style={{display:'flex', gap:'12px'}}>
            <button className="btn-secondary" style={{color:'var(--rose)', borderColor:'var(--rose)'}} onClick={() => {
              if (window.confirm('Are you sure you want to delete ALL student data? This cannot be undone.')) {
                fetch(`${API_BASE}/students`, { method: 'DELETE' })
                  .then(() => setStudents([]))
                  .catch(err => alert('Failed to clear data: ' + err.message));
              }
            }}>Clear All Data</button>
            <button className="btn-secondary" onClick={onBack}>Back to Landing</button>
          </div>
        </div>

        <div className="admin-stats">
          <div className="admin-stat-card">
            <div className="admin-stat-val">{students.length}</div>
            <div className="admin-stat-lbl">Total Registrations</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-val">{students.filter(s => s.user_type === 'student').length}</div>
            <div className="admin-stat-lbl">Students</div>
          </div>
          <div className="admin-stat-card">
            <div className="admin-stat-val">{students.filter(s => s.user_type === 'professional').length}</div>
            <div className="admin-stat-lbl">Professionals</div>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Pos</th>
                <th>Name</th>
                <th>Type</th>
                <th>Contact</th>
                <th>Institution / Organisation</th>
                <th>Programmes</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}>
                  <td><strong>#{String(student.position).padStart(3, '0')}</strong></td>
                  <td>
                    <div style={{fontWeight:600}}>{student.name}</div>
                    <div style={{fontSize:'12px', color:'var(--text-3)'}}>{student.id}</div>
                  </td>
                  <td>
                    <span className={`admin-badge ${student.user_type}`}>
                      {student.user_type}
                    </span>
                  </td>
                  <td>
                    <div>{student.email}</div>
                    <div style={{fontSize:'12px', color:'var(--text-3)'}}>{student.phone}</div>
                  </td>
                  <td>
                    <div>{student.institution}</div>
                    <div style={{fontSize:'12px', color:'var(--text-3)'}}>{student.pincode}</div>
                  </td>
                  <td>
                    <div className="course-tags">
                      {student.courses.map(c => (
                        <span key={c} className="course-tag">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td>{new Date(student.joined_at).toLocaleDateString('en-IN', {day:'2-digit', month:'short'})}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const App = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [counts, setCounts] = useState({ total: 0, litigation: 0, drafting: 0, judgment: 0, bundle: 0 });
  const [animatedCounts, setAnimatedCounts] = useState({ total: 0, litigation: 0, drafting: 0, judgment: 0 });
  
  // Form State
  const [userType, setUserType] = useState('student');
  const [selectedCourses, setSelectedCourses] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    institution: '',
    pincode: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successData, setSuccessData] = useState(null);

  // --- Effects ---
  const fetchCounts = () => {
    fetch(`${API_BASE}/counts`)
      .then(res => res.json())
      .then(data => setCounts(data))
      .catch(err => console.error('Failed to fetch counts:', err));
  };

  useEffect(() => {
    fetchCounts();
    // Check if URL has admin hash
    if (window.location.hash === '#admin') setIsAdmin(true);
  }, []);

  useEffect(() => {
    // Animate counts
    const duration = 1000;
    const startTotal = animatedCounts.total;
    const startLit = animatedCounts.litigation;
    const startDrf = animatedCounts.drafting;
    const startJdg = animatedCounts.judgment;

    const startTime = performance.now();

    const tick = (now) => {
      const p = Math.min(1, (now - startTime) / duration);
      const ease = 1 - Math.pow(1 - p, 3);
      
      setAnimatedCounts({
        total: Math.round(startTotal + (counts.total - startTotal) * ease),
        litigation: Math.round(startLit + (counts.litigation - startLit) * ease),
        drafting: Math.round(startDrf + (counts.drafting - startDrf) * ease),
        judgment: Math.round(startJdg + (counts.judgment - startJdg) * ease),
      });

      if (p < 1) requestAnimationFrame(tick);
    };

    requestAnimationFrame(tick);
  }, [counts]);

  // --- Handlers ---
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    const field = id.replace('f-', '');
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: false }));
    }
  };

  const toggleCourse = (course) => {
    setSelectedCourses(prev => {
      let newSelection;
      if (prev.includes(course)) {
        newSelection = prev.filter(c => c !== course);
      } else {
        if (course === 'bundle') {
          // If bundle is selected, remove all others
          newSelection = ['bundle'];
        } else {
          // If individual course is selected, remove bundle
          newSelection = [...prev.filter(c => c !== 'bundle'), course];
        }
      }
      if (errors.courses) setErrors(prevErr => ({ ...prevErr, courses: false }));
      return newSelection;
    });
  };

  const handleCtaClick = (course) => {
    setSelectedCourses([course]);
    document.getElementById('signup').scrollIntoView({ behavior: 'smooth' });
  };

  const validate = () => {
    const newErrors = {};
    if (selectedCourses.length === 0) newErrors.courses = true;
    if (!formData.name.trim()) newErrors.name = true;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = true;
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) newErrors.phone = true;
    if (!formData.institution.trim()) newErrors.institution = true;
    if (!/^\d{6}$/.test(formData.pincode)) newErrors.pincode = true;
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);

    const refId = 'LO-' + Date.now().toString(36).toUpperCase().slice(-5) + Math.random().toString(36).slice(2, 5).toUpperCase();
    
    const record = {
      id: refId,
      user_type: userType,
      courses: selectedCourses,
      ...formData,
      joined_at: new Date().toISOString()
    };

    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(record)
      });
      
      const data = await res.json();
      setSuccessData({ refId: data.id, position: data.position });
      fetchCounts();
    } catch (err) {
      console.error('Submission failed:', err);
      alert('Failed to join waitlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', phone: '', institution: '', pincode: '' });
    setSelectedCourses([]);
    setUserType('student');
    setSuccessData(null);
    setErrors({});
    document.getElementById('signup').scrollIntoView({ behavior: 'smooth' });
  };

  const getCoursePrice = (course, type) => {
    const pricing = {
      litigation: { student: '₹2,999', professional: '₹4,999' },
      drafting: { student: '₹2,499', professional: '₹3,999' },
      judgment: { student: '₹999', professional: '₹1,799' },
      bundle: { student: '₹4,999', professional: '₹8,999' }
    };
    return pricing[course][type];
  };

  if (isAdmin) return <AdminPanel onBack={() => { setIsAdmin(false); window.location.hash = ''; }} />;

  return (
    <div className="app-root">
      {/* ANNOUNCEMENT BAR */}
      <div className="announce">
        <strong>★ JUNE 2026 COHORT</strong> - Live online - Train from anywhere in India <a href="#signup">Join waitlist →</a>
      </div>

      {/* NAVBAR */}
      <nav className="top">
        <div className="wrap nav-inner">
          <div className="logo">
            <div className="logo-mark">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M12 2 L22 7 V13 C22 17 17 21 12 22 C7 21 2 17 2 13 V7 Z" stroke="white" strokeWidth="2" fill="rgba(212,160,23,.15)"/>
                <path d="M8 12 L11 15 L16 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            Legal <b>Olympiad</b>
          </div>



          <div className={`nav-links ${menuOpen ? 'open' : ''}`}>
            <a href="#gap" className="hidden-mobile" onClick={() => setMenuOpen(false)}>The Gap</a>
            <a href="#courses" className="hidden-mobile" onClick={() => setMenuOpen(false)}>Programmes</a>
            <a href="#faq" className="hidden-mobile" onClick={() => setMenuOpen(false)}>FAQ</a>
            <a href="#admin" className="hidden-mobile" onClick={(e) => { e.preventDefault(); setIsAdmin(true); setMenuOpen(false); }}>Admin</a>
            <a href="#signup" className="nav-cta" onClick={() => setMenuOpen(false)}><span className="pulse"></span>Join Waitlist</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="wrap">
          <span className="eyebrow"><span className="live"></span>Waitlist now open - Inaugural cohort starts June 2026</span>
          <h1 className="hero-title">
            Years of <em>law school.</em><br />
            Almost no <em>practice.</em><br />
            <span className="muted">We fix that.</span>
          </h1>
          <p className="hero-sub">
            Practitioner-led training for <strong>law students and early-career professionals</strong>. Built with senior advocates. Taught through real files. Designed for anyone who refuses to walk into chambers unprepared.
          </p>
          <div className="hero-ctas">
            <a href="#signup" className="btn-primary">
              Join the waitlist
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </a>
            <a href="#courses" className="btn-secondary">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M4 6h16M4 12h16M4 18h12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              See the programmes
            </a>
          </div>

          {/* COHORT CARD */}
          <div className="cohort-card">
            <div className="cohort-date">
              <span className="mo">JUN</span>
              <span className="yr">'26</span>
            </div>
            <div className="cohort-info">
              <h4>Inaugural Cohort - June 2026</h4>
              <p><strong>Live online - Train from anywhere in India.</strong> Limited to 40 students per batch to preserve mentorship quality. Waitlist members get <strong>priority admission</strong> and <strong>locked-in early-bird pricing</strong> when seats open.</p>
            </div>
            <div className="cohort-cta-wrap">
              <a href="#signup" className="btn-primary" style={{width:'100%', justifyContent:'center'}}>Join waitlist →</a>
            </div>
          </div>

          <div className="hero-trust">
            <div className="trust-item"><span className="num">03</span><span className="lbl">FLAGSHIP PROGRAMMES</span></div>
            <div className="trust-item"><span className="num">11</span><span className="lbl">WEEKS OF TRAINING</span></div>
            <div className="trust-item"><span className="num">40</span><span className="lbl">SEATS PER COHORT</span></div>
            <div className="trust-item"><span className="num">1:1</span><span className="lbl">PRACTITIONER FEEDBACK</span></div>
          </div>
        </div>
      </section>

      {/* THE GAP */}
      <section className="gap-section" id="gap">
        <div className="wrap-narrow">
          <div className="section-kicker">The honest truth</div>
          <h2 className="section-title">Law school taught you <em>what to know.</em><br />Nobody taught you what to <em>do.</em></h2>
          <p className="section-lede">Talk to any junior in a chamber. They'll tell you the same thing: the first six months were spent unlearning law school habits and learning the actual job. We compress that hidden curriculum into 11 weeks.</p>

          <div className="gap-grid">
            <div className="gap-col before">
              <h4>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6" strokeLinecap="round"/></svg>
                What law school left out
              </h4>
              <ul>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6" strokeLinecap="round"/></svg>
                  <span><strong>You can recite section numbers.</strong> But you've never opened a real case file or known where a chronology goes.</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6" strokeLinecap="round"/></svg>
                  <span><strong>You've memorised landmark cases.</strong> But ratio versus obiter still feels like a coin flip when a senior asks you under pressure.</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6" strokeLinecap="round"/></svg>
                  <span><strong>You can draft an answer in an exam.</strong> But you've never written a plaint, a sale deed, or a written statement that actually has to hold up.</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m15 9-6 6M9 9l6 6" strokeLinecap="round"/></svg>
                  <span><strong>You've debated in moot court.</strong> But the silence of a real courtroom, with a real judge looking up at you, is a different animal entirely.</span>
                </li>
              </ul>
            </div>

            <div className="gap-col after">
              <h4>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                What you'll walk away with
              </h4>
              <ul>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span><strong>The reflexes of a working junior.</strong> Build a file from raw facts, draft a case note, frame propositions, all under deadline.</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span><strong>A drafting portfolio.</strong> Sale deeds, wills, NDAs, plaints, written statements. Real documents, redlined by practitioners.</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span><strong>Analytical authority.</strong> Read any judgment cold and tell the room exactly what binds, what doesn't, and what the dissent quietly opens up.</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  <span><strong>Courtroom muscle memory.</strong> Observe live proceedings, then argue your own mock case end-to-end before evaluators who've done the real thing.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CREDIBILITY STRIP */}
      <div className="credibility">
        <div className="wrap">
          <div className="cred-label">Curriculum designed with input from</div>
          <div className="credibility-row" style={{display:'flex', justifyContent:'space-around', flexWrap:'wrap', gap:'20px', padding:'20px 0'}}>
            <span className="cred-item">Practising Advocates</span>
            <span className="cred-item">Senior Counsel</span>
            <span className="cred-item">Trial Court Judges</span>
            <span className="cred-item">Corporate Legal Teams</span>
            <span className="cred-item">Legal Research Scholars</span>
          </div>
        </div>
      </div>

      {/* COURSES */}
      <section className="courses" id="courses">
        <div className="wrap">
          <div className="courses-intro">
            <div className="section-kicker">Three programmes</div>
            <h2>Pick the skill that <em>scares you most.</em><br />Walk out fluent in it.</h2>
            <p>Each programme targets a specific gap most law students don't realise they have, until it's their first day in chambers. Take one. Take all three. They stack.</p>
          </div>

          {/* COURSE 1 */}
          <div className="course-block">
            <div className="course-block-card">
              <div className="course-hook">
                <div className="course-numeral-big">I</div>
                <div className="course-hook-text">
                  <div className="fear-quote">
                    <span className="fear-label">The unspoken thought</span>
                    <span className="fear-text">What if I freeze the moment it's my turn to speak?</span>
                  </div>
                  <h3>Litigation Training Programme</h3>
                  <div className="promise">From facts on a desk to feet in a courtroom, in five weeks.</div>
                </div>
                <div className="course-meta-pills">
                  <span className="pill dur">5 Weeks</span>
                  <span className="pill live">Live Online</span>
                  <span className="pill hot">★ Flagship</span>
                  <span className="pill start">Starts June 2026</span>
                </div>
              </div>
              <div className="course-body-grid">
                <div className="course-left">
                  <div className="pitch-block">
                    <p>This is the programme we wish we'd had before our first day in chambers. It walks you through the entire workflow of a litigating junior, the way a senior would actually teach you if they had the time. <strong>Five weeks. One real file. One end-to-end mock hearing.</strong> By the time you finish, the courtroom won't be a foreign country anymore. It'll be a place you've already worked in.</p>
                  </div>
                  <div className="outcomes-block">
                    <div className="block-label">By the end, you'll be able to</div>
                    <div className="outcomes">
                      {[
                        "Open a fresh case file and know exactly what goes where, without asking",
                        "Find the binding precedent in 20 minutes, not three hours of textbook flipping",
                        "Frame propositions of law a senior can read once and take into court",
                        "Stand up and argue in front of a panel without your voice breaking on the first sentence"
                      ].map((text, i) => (
                        <div className="outcome" key={i}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span><strong>{text.split(' ')[0] + ' ' + text.split(' ')[1] + ' ' + text.split(' ')[2] + ' ' + text.split(' ')[3]}</strong>{text.substring(text.split(' ')[0].length + text.split(' ')[1].length + text.split(' ')[2].length + text.split(' ')[3].length + 3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="curriculum-block">
                    <div className="block-label">Five-week curriculum</div>
                    <div className="curriculum-grid">
                      <div>Week 1: Research methodology &amp; precedent</div>
                      <div>Week 2: File preparation &amp; case notes</div>
                      <div>Week 3: Issue framing &amp; propositions</div>
                      <div>Week 4: Drafting pleadings &amp; affidavits</div>
                      <div>Week 5: Live practitioner session + mock hearing</div>
                      <div>Capstone: End-to-end simulated case</div>
                    </div>
                  </div>
                </div>
                <div className="course-right">
                  <div className="for-whom">
                    <h5>Who this is for</h5>
                    <ul>
                      <li>3rd, 4th, 5th year law students considering litigation</li>
                      <li>Recent graduates joining a chamber or trial court practice</li>
                      <li>Anyone who wants real courtroom muscle memory before their first brief</li>
                    </ul>
                  </div>
                  <div className="testimonial">
                    <p>"I mooted for three years. None of it prepared me for the silence when a real judge looked up. This programme would have saved me six months of confusion."</p>
                    <cite><b>Junior Advocate, Delhi High Court</b> - Programme advisor</cite>
                  </div>
                  <div className="price-block">
                    <div className="pl">Inaugural cohort pricing</div>
                    <div className="price-tiers">
                      <div className="price-tier student">
                        <div className="tier-lbl"><span className="dot"></span>Students</div>
                        <div className="tier-amt"><span className="r">₹</span>2,999</div>
                        <div className="tier-strike">Standard ₹6,999</div>
                      </div>
                      <div className="price-tier pro">
                        <div className="tier-lbl"><span className="dot"></span>Professionals</div>
                        <div className="tier-amt"><span className="r">₹</span>4,999</div>
                        <div className="tier-strike">Standard ₹6,999</div>
                      </div>
                    </div>
                    <div className="pf">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z"/></svg>
                      INAUGURAL COHORT - Limited-time pricing
                    </div>
                    <div className="pn">No payment now - Locked-in for waitlist members</div>
                  </div>
                  <div className="wl-info">
                    <span className="wl-l"><span className="wl-dot"></span>Currently on waitlist</span>
                    <span className="wl-n">{String((counts.litigation || 0) + (counts.bundle || 0)).padStart(2, '0')}</span>
                  </div>
                  <button className="course-cta-btn" onClick={() => handleCtaClick('litigation')}>
                    Join the Litigation waitlist
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* COURSE 2 */}
          <div className="course-block">
            <div className="course-block-card">
              <div className="course-hook">
                <div className="course-numeral-big">II</div>
                <div className="course-hook-text">
                  <div className="fear-quote">
                    <span className="fear-label">The unspoken thought</span>
                    <span className="fear-text">What if my senior redlines every line of what I write?</span>
                  </div>
                  <h3>Drafting &amp; Conveyancing</h3>
                  <div className="promise">Become the junior whose drafts go through almost untouched.</div>
                </div>
                <div className="course-meta-pills">
                  <span className="pill dur">4 Weeks</span>
                  <span className="pill live">Live Online</span>
                  <span className="pill fmt">Workshop-led</span>
                  <span className="pill hot">High ROI</span>
                  <span className="pill start">Starts June 2026</span>
                </div>
              </div>
              <div className="course-body-grid">
                <div className="course-left">
                  <div className="pitch-block">
                    <p>Drafting is the single most billable, most teachable, most career-defining skill nobody actually teaches in law school. <strong>This is the programme that fixes that.</strong> In four weeks, you'll draft sale deeds, wills, NDAs, shareholder agreements, plaints, and written statements, then watch them get redlined by practitioners who do this work every day. By week four, your drafts will look like they came out of a chamber, not a classroom.</p>
                  </div>
                  <div className="outcomes-block">
                    <div className="block-label">By the end, you'll be able to</div>
                    <div className="outcomes">
                      {[
                        "Walk into any drafting brief with a structure already in your head",
                        "Draft a clean sale deed, lease, or NDA in a sitting, not a week",
                        "Spot the indemnity, jurisdiction, and dispute clauses that quietly decide who wins later",
                        "Build a portfolio of your own work, ready to show in any chamber interview"
                      ].map((text, i) => (
                        <div className="outcome" key={i}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span><strong>{text.split(' ')[0] + ' ' + text.split(' ')[1] + ' ' + text.split(' ')[2] + ' ' + text.split(' ')[3]}</strong>{text.substring(text.split(' ')[0].length + text.split(' ')[1].length + text.split(' ')[2].length + text.split(' ')[3].length + 3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="curriculum-block">
                    <div className="block-label">Four-week curriculum</div>
                    <div className="curriculum-grid">
                      <div>Foundations of precise legal writing</div>
                      <div>Sale, lease, gift, mortgage deeds</div>
                      <div>Wills, codicils, trust deeds</div>
                      <div>Shareholder agreements &amp; NDAs</div>
                      <div>Plaints, written statements, petitions</div>
                      <div>Live redlining &amp; peer review</div>
                    </div>
                  </div>
                </div>
                <div className="course-right">
                  <div className="for-whom">
                    <h5>Who this is for</h5>
                    <ul>
                      <li>Students heading into transactional, corporate, or property practice</li>
                      <li>Future litigators who want their pleadings to actually land</li>
                      <li>Anyone interviewing at a firm where drafting is the entry test</li>
                    </ul>
                  </div>
                  <div className="testimonial">
                    <p>"In our firm we hire the junior who can draft, not the one with the best grades. Most law graduates can't. This is exactly the gap that needs closing."</p>
                    <cite><b>Partner, Tier-1 Law Firm</b> - Programme advisor</cite>
                  </div>
                  <div className="price-block">
                    <div className="pl">Inaugural cohort pricing</div>
                    <div className="price-tiers">
                      <div className="price-tier student">
                        <div className="tier-lbl"><span className="dot"></span>Students</div>
                        <div className="tier-amt"><span className="r">₹</span>2,499</div>
                        <div className="tier-strike">Standard ₹5,499</div>
                      </div>
                      <div className="price-tier pro">
                        <div className="tier-lbl"><span className="dot"></span>Professionals</div>
                        <div className="tier-amt"><span className="r">₹</span>3,999</div>
                        <div className="tier-strike">Standard ₹5,499</div>
                      </div>
                    </div>
                    <div className="pf">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z"/></svg>
                      INAUGURAL COHORT - Limited-time pricing
                    </div>
                    <div className="pn">No payment now - Locked-in for waitlist members</div>
                  </div>
                  <div className="wl-info">
                    <span className="wl-l"><span className="wl-dot"></span>Currently on waitlist</span>
                    <span className="wl-n">{String((counts.drafting || 0) + (counts.bundle || 0)).padStart(2, '0')}</span>
                  </div>
                  <button className="course-cta-btn" onClick={() => handleCtaClick('drafting')}>
                    Join the Drafting waitlist
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* COURSE 3 */}
          <div className="course-block">
            <div className="course-block-card">
              <div className="course-hook">
                <div className="course-numeral-big">III</div>
                <div className="course-hook-text">
                  <div className="fear-quote">
                    <span className="fear-label">The unspoken thought</span>
                    <span className="fear-text">I can name the case. I can't tell you what it actually decided.</span>
                  </div>
                  <h3>Judgment Appreciation</h3>
                  <div className="promise">Stop memorising cases. Start wielding them.</div>
                </div>
                <div className="course-meta-pills">
                  <span className="pill dur">2 Weeks</span>
                  <span className="pill live">Live Online</span>
                  <span className="pill fmt">Analysis-heavy</span>
                  <span className="pill hot">Foundational</span>
                  <span className="pill start">Starts June 2026</span>
                </div>
              </div>
              <div className="course-body-grid">
                <div className="course-left">
                  <div className="pitch-block">
                    <p>This is the skill that quietly separates good lawyers from great ones. Anyone can quote a case. <strong>Few can read a judgment cold and tell you within five minutes what binds, what doesn't, what the dissent quietly opens up, and how the next case might bend it.</strong> Two weeks. A curated set of landmark judgments. Your own paper presentation, defended live in front of peers and faculty. By the end, you won't read judgments the same way again.</p>
                  </div>
                  <div className="outcomes-block">
                    <div className="block-label">By the end, you'll be able to</div>
                    <div className="outcomes">
                      {[
                        "Separate ratio from obiter on the first read, every time",
                        "Argue binding authority confidently instead of nodding nervously when challenged",
                        "Spot the dissent that becomes law tomorrow, the move that wins a future appeal",
                        "Publish a paper on a landmark judgment, defended in oral presentation"
                      ].map((text, i) => (
                        <div className="outcome" key={i}>
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          <span><strong>{text.split(' ')[0] + ' ' + text.split(' ')[1] + ' ' + text.split(' ')[2] + ' ' + text.split(' ')[3]}</strong>{text.substring(text.split(' ')[0].length + text.split(' ')[1].length + text.split(' ')[2].length + text.split(' ')[3].length + 3)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="curriculum-block">
                    <div className="block-label">Two-week curriculum</div>
                    <div className="curriculum-grid">
                      <div>Curated landmark judgment pack</div>
                      <div>Foundations of judgment appreciation</div>
                      <div>Ratio, obiter, precedent, interpretation</div>
                      <div>Critical evaluation &amp; dissent analysis</div>
                      <div>Paper presentation before peers</div>
                      <div>Thematic Q&amp;A &amp; faculty critique</div>
                    </div>
                  </div>
                </div>
                <div className="course-right">
                  <div className="for-whom">
                    <h5>Who this is for</h5>
                    <ul>
                      <li>Students preparing for judicial services or clerkships</li>
                      <li>Future appellate lawyers and academics</li>
                      <li>Anyone tired of memorising cases without truly understanding them</li>
                    </ul>
                  </div>
                  <div className="testimonial">
                    <p>"The candidates who stand out aren't the ones who quote the most cases. They're the ones who know exactly which sentence in the judgment binds. That's a teachable skill, and most law schools never teach it."</p>
                    <cite><b>Sitting Judge, Trial Court</b> - Programme advisor</cite>
                  </div>
                  <div className="price-block">
                    <div className="pl">Inaugural cohort pricing</div>
                    <div className="price-tiers">
                      <div className="price-tier student">
                        <div className="tier-lbl"><span className="dot"></span>Students</div>
                        <div className="tier-amt"><span className="r">₹</span>999</div>
                        <div className="tier-strike">Standard ₹2,499</div>
                      </div>
                      <div className="price-tier pro">
                        <div className="tier-lbl"><span className="dot"></span>Professionals</div>
                        <div className="tier-amt"><span className="r">₹</span>1,799</div>
                        <div className="tier-strike">Standard ₹2,499</div>
                      </div>
                    </div>
                    <div className="pf">
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z"/></svg>
                      INAUGURAL COHORT - Limited-time pricing
                    </div>
                    <div className="pn">No payment now - Locked-in for waitlist members</div>
                  </div>
                  <div className="wl-info">
                    <span className="wl-l"><span className="wl-dot"></span>Currently on waitlist</span>
                    <span className="wl-n">{String((counts.judgment || 0) + (counts.bundle || 0)).padStart(2, '0')}</span>
                  </div>
                  <button className="course-cta-btn" onClick={() => handleCtaClick('judgment')}>
                    Join the Judgment waitlist
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BUNDLE */}
      <section className="bundle-section" id="bundle">
        <div className="wrap">
          <div className="bundle-card">
            <div>
              <span className="bundle-tag">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z"/></svg>
                The full transformation
              </span>
              <h3>The <em>Complete Advocate</em> Bundle</h3>
              <p>All three programmes. Eleven weeks. One transformation from "law student" to "the junior every chamber wants to hire." Capped at 25 students per bundle cohort because mentorship at this depth doesn't scale.</p>
              <div className="bundle-perks">
                {[
                  "All three programmes, fully sequenced for compounding skill",
                  "Priority slots in live sessions with senior advocates",
                  "Composite certification with merit recognition",
                  "Alumni access to our chambers network"
                ].map((text, i) => (
                  <div className="bundle-perk" key={i}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6 9 17l-5-5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    {text}
                  </div>
                ))}
              </div>
              <button className="bundle-cta" onClick={() => handleCtaClick('bundle')}>
                Join the bundle waitlist
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
            </div>
            <div className="bundle-right">
              <div className="bundle-price-lbl">Inaugural cohort pricing</div>
              <div style={{display:'flex', flexDirection:'column', gap:'18px', alignItems:'flex-end'}}>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:'11px', fontFamily:'JetBrains Mono,monospace', letterSpacing:'.12em', textTransform:'uppercase', color:'var(--gold-3)', fontWeight:'600', marginBottom:'6px', display:'inline-flex', alignItems:'center', gap:'6px', justifyContent:'flex-end'}}><span style={{width:'5px', height:'5px', borderRadius:'50%', background:'var(--gold-3)'}}></span>Students</div>
                  <div className="bundle-now"><span className="r">₹</span>4,999</div>
                  <div className="bundle-was">Standard ₹12,999</div>
                </div>
                <div style={{textAlign:'right', paddingTop:'14px', borderTop:'1px solid rgba(255,255,255,.1)', width:'100%'}}>
                  <div style={{fontSize:'11px', fontFamily:'JetBrains Mono,monospace', letterSpacing:'.12em', textTransform:'uppercase', color:'#86efac', fontWeight:'600', marginBottom:'6px', display:'inline-flex', alignItems:'center', gap:'6px', justifyContent:'flex-end'}}><span style={{width:'5px', height:'5px', borderRadius:'50%', background:'#86efac'}}></span>Professionals</div>
                  <div style={{fontFamily:'Instrument Serif,serif', fontStyle:'italic', fontSize:'48px', fontWeight:'400', lineHeight:'1', color:'white'}}><span style={{fontSize:'28px', verticalAlign:'super', color:'rgba(255,255,255,.6)', fontStyle:'normal'}}>₹</span>8,999</div>
                  <div className="bundle-was" style={{marginTop:'6px'}}>Standard ₹12,999</div>
                </div>
                <span className="bundle-save">Save up to ₹8,000</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LIVE COUNTER */}
      <section className="counter">
        <div className="wrap counter-inner">
          <div className="counter-stats">
            <div className="c-stat"><span className="c-num">{String(animatedCounts.total).padStart(2, '0')}</span><span className="c-lbl">Total on Waitlist</span></div>
            <div className="c-stat"><span className="c-num">{String(animatedCounts.litigation).padStart(2, '0')}</span><span className="c-lbl">Litigation</span></div>
            <div className="c-stat"><span className="c-num">{String(animatedCounts.drafting).padStart(2, '0')}</span><span className="c-lbl">Drafting</span></div>
            <div className="c-stat"><span className="c-num">{String(animatedCounts.judgment).padStart(2, '0')}</span><span className="c-lbl">Judgment</span></div>
          </div>
          <div className="live-badge">
            <span style={{width:'6px', height:'6px', background:'#16a34a', borderRadius:'50%', animation:'breathe 2s infinite'}}></span>
            Live waitlist counter
          </div>
        </div>
      </section>

      {/* SIGNUP */}
      <section className="signup" id="signup">
        <div className="wrap signup-grid">
          <div className="signup-left">
            <div className="section-kicker">Join the waitlist</div>
            <h2>No payment.<br /><em>Just your name.</em></h2>
            <p>We're preparing the June 2026 cohort with extraordinary care. Join the waitlist and you'll be among the first to know when enrolments open, with priority admission and locked-in early-bird pricing reserved for waitlist members.</p>

            <div className="assurances">
              {[
                { title: "Zero payment collected today", desc: "This is a waitlist, not an enrolment. You pay only when you choose to formally enrol later.", icon: <path d="M12 1v22M17 5H9.5a3.5 3.5 0 1 0 0 7h5a3.5 3.5 0 1 1 0 7H6" strokeLinecap="round"/> },
                { title: "Priority admission & locked-in early-bird rates", desc: "Waitlist members get first access to seats and the lowest published price when registration opens.", icon: <path d="M12 2l3 7h7l-5.5 4 2 7-6.5-4.5L5.5 20l2-7L2 9h7z" strokeLinejoin="round"/> },
                { title: "Your details stay with us", desc: "No spam, no third-party sharing. We contact you only about the June 2026 cohort and future batches.", icon: <path d="M12 2L4 6v6c0 5 3.5 9 8 10 4.5-1 8-5 8-10V6l-8-4z" strokeLinejoin="round"/> }
              ].map((item, i) => (
                <div className="assurance" key={i}>
                  <div className="assurance-ico">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">{item.icon}</svg>
                  </div>
                  <div>
                    <h5>{item.title}</h5>
                    <p>{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            {!successData ? (
              <form id="form" className="signup-card" onSubmit={handleSubmit} noValidate>
                <div className="form-label">WAITLIST - JUNE 2026 COHORT</div>
                <h3>Join the waitlist.</h3>
                <p className="form-sub"><strong>No payment collected.</strong> Takes under a minute.</p>

                <div className="field">
                  <label>I am a <span className="req">*</span></label>
                  <div className="type-toggle">
                    <label>
                      <input type="radio" name="userType" value="student" checked={userType === 'student'} onChange={() => setUserType('student')} />
                      <span className="ico">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10 12 5 2 10l10 5 10-5z" strokeLinejoin="round"/><path d="M6 12v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" strokeLinecap="round"/></svg>
                      </span>
                      Law student
                    </label>
                    <label>
                      <input type="radio" name="userType" value="professional" checked={userType === 'professional'} onChange={() => setUserType('professional')} />
                      <span className="ico">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 7H4c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V9c0-1.1-.9-2-2-2zM16 7V5c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2" strokeLinejoin="round"/></svg>
                      </span>
                      Practising professional
                    </label>
                  </div>
                  <div className="type-helper">
                    {userType === 'student' 
                      ? '// Student pricing applies. Includes UG, PG, and recent graduates.' 
                      : '// Professional pricing applies. Advocates, in-house counsel, judicial aspirants.'}
                  </div>
                </div>

                <div className="field">
                  <label>Which programme(s) interest you? <span className="req">*</span></label>
                  <div className="picker">
                    {[
                      { id: 'litigation', title: 'Litigation Training', meta: '5 wk' },
                      { id: 'drafting', title: 'Drafting & Conveyancing', meta: '4 wk' },
                      { id: 'judgment', title: 'Judgment Appreciation', meta: '2 wk' },
                      { id: 'bundle', title: 'Complete Advocate Bundle', meta: '11 wk' }
                    ].map(course => (
                      <label key={course.id} className={`pick ${selectedCourses.includes(course.id) ? 'selected' : ''}`}>
                        <input type="checkbox" name="courses" value={course.id} checked={selectedCourses.includes(course.id)} onChange={() => toggleCourse(course.id)} />
                        <span className="pick-title">{course.title}</span>
                        <span className="pick-meta">{course.meta} - {getCoursePrice(course.id, userType)}</span>
                      </label>
                    ))}
                  </div>
                  <div className={`error-msg ${errors.courses ? 'show' : ''}`}>Please select at least one programme.</div>
                </div>

                <div className="field">
                  <label>Full name <span className="req">*</span></label>
                  <input type="text" id="f-name" placeholder="e.g. Aarav Menon" value={formData.name} onChange={handleInputChange} />
                  <div className={`error-msg ${errors.name ? 'show' : ''}`}>Please enter your full name.</div>
                </div>

                <div className="row2">
                  <div className="field">
                    <label>Email <span className="req">*</span></label>
                    <input type="email" id="f-email" placeholder="you@college.edu" value={formData.email} onChange={handleInputChange} />
                    <div className={`error-msg ${errors.email ? 'show' : ''}`}>Please enter a valid email.</div>
                  </div>
                  <div className="field">
                    <label>Phone <span className="req">*</span></label>
                    <input type="tel" id="f-phone" placeholder="10 digits" value={formData.phone} onChange={handleInputChange} />
                    <div className={`error-msg ${errors.phone ? 'show' : ''}`}>10-digit phone number required.</div>
                  </div>
                </div>

                <div className="row2">
                  <div className="field">
                    <label>{userType === 'student' ? 'College / Institution' : 'Firm / Chamber / Organisation'} <span className="req">*</span></label>
                    <input type="text" id="f-institution" placeholder={userType === 'student' ? "e.g. NLSIU, GLC Mumbai" : "e.g. AZB Partners"} value={formData.institution} onChange={handleInputChange} />
                    <div className={`error-msg ${errors.institution ? 'show' : ''}`}>Please enter your institution.</div>
                  </div>
                  <div className="field">
                    <label>Pincode <span className="req">*</span></label>
                    <input type="text" id="f-pincode" placeholder="6 digits" maxLength="6" value={formData.pincode} onChange={handleInputChange} />
                    <div className={`error-msg ${errors.pincode ? 'show' : ''}`}>Please enter a valid 6-digit pincode.</div>
                  </div>
                </div>

                <div className="submit-area">
                  <button type="submit" className="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Adding you to waitlist...' : 'Join the waitlist'}
                    {!isSubmitting && <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                  <div className="submit-note">No payment now. You'll hear from us when enrolments open.</div>
                </div>
              </form>
            ) : (
              <div className="success-panel show">
                <div className="success-ico">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="m5 12 5 5L20 7" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <h3>You're on the waitlist.</h3>
                <p>We'll email you the moment enrolments open, with priority access and locked-in early-bird pricing. Expect first word ahead of the June 2026 cohort.</p>
                <div className="success-position">
                  <span className="pos-lbl">Your waitlist position</span>
                  <span className="pos-val">#{String(successData.position).padStart(3, '0')}</span>
                </div>
                <br />
                <div className="success-refid">{successData.refId}</div>
                <br />
                <button className="btn-secondary" onClick={resetForm}>Add another student</button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="faq" id="faq">
        <div className="wrap faq-grid">
          <div>
            <div className="section-kicker">Common questions</div>
            <h2 className="section-title">The <em>honest</em> answers.</h2>
            <p style={{color:'var(--text-2)', fontSize:'15px', lineHeight:'1.6', maxWidth:'320px'}}>
              If your question isn't here, reach us at <a href="mailto:admissions@legalolympiad.in" style={{color:'var(--accent)', textDecoration:'underline'}}>admissions@legalolympiad.in</a>
            </p>
          </div>

          <div className="faq-list">
            {[
              { q: "Is this a waitlist or an enrolment?", a: "This is strictly a waitlist. No payment is collected and no seat is formally reserved. Waitlist members are the first to be contacted when enrolments open, with priority access and locked-in early-bird pricing." },
              { q: "When do the programmes start?", a: "All three programmes launch with our inaugural cohort in June 2026. Exact start dates, schedules, and city-wise batch details will be shared with waitlist members first, typically four to six weeks before enrolment opens." },
              { q: "Do I have to pay anything now?", a: "No. The waitlist is entirely free. You don't pay until you formally enrol, which happens later when we open registration. The pricing displayed is indicative and locked-in for waitlist members." },
              { q: "Can I join the waitlist for more than one programme?", a: "Yes. Select all the programmes you're interested in on the form, or choose the Complete Advocate Bundle to register interest across all three at a better combined rate." },
              { q: "Is the waitlist first-come-first-served?", a: "Waitlist position is recorded chronologically and members are contacted in order when enrolments open. With only 40 seats per batch, earlier signups have meaningfully better access." },
              { q: "How are the programmes delivered?", a: "Fully online, in live cohorts. Lectures, workshops, redlining sessions, mock hearings, and practitioner Q&A all happen live on video, with the same intensity as an in-person classroom. You join from anywhere in India. Recorded sessions are made available to enrolled students for revision." }
            ].map((item, i) => (
              <details className="faq-item" key={i}>
                <summary className="faq-q">
                  <h5>{item.q}</h5>
                  <span className="toggle"><svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/></svg></span>
                </summary>
                <div className="faq-a">{item.a}</div>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="wrap">
          <div className="foot-top">
            <div>
              <div className="logo">
                <div className="logo-mark">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2 L22 7 V13 C22 17 17 21 12 22 C7 21 2 17 2 13 V7 Z" stroke="white" strokeWidth="2" fill="rgba(212,160,23,.15)"/>
                    <path d="M8 12 L11 15 L16 10" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                Legal <b>Olympiad</b>
              </div>
              <p className="tag-line">Practitioner-led professional training for India's next generation of litigators. Inaugural cohort: June 2026.</p>
            </div>
            <div>
              <h5>Programmes</h5>
              <a href="#courses">Litigation Training</a>
              <a href="#courses">Drafting &amp; Conveyancing</a>
              <a href="#courses">Judgment Appreciation</a>
              <a href="#bundle">Complete Bundle</a>
            </div>
            <div>
              <h5>Institution</h5>
              <a href="#gap">The Gap</a>
              <a href="#faq">FAQ</a>
              <a href="#">Faculty</a>
              <a href="#">Brochure (PDF)</a>
            </div>
            <div>
              <h5>Contact</h5>
              <a href="#signup">Join Waitlist</a>
              <a href="mailto:admissions@legalolympiad.in">admissions@legalolympiad.in</a>
              <a href="#">Schedule a call</a>
            </div>
          </div>
          <div className="foot-btm">
            <span>© 2026 LEGAL OLYMPIAD - ALL RIGHTS RESERVED</span>
            <span>INAUGURAL COHORT - JUNE 2026</span>
          </div>
        </div>
      </footer>

      {/* FLOATING ADMIN BUTTON */}
      <div className="admin-nav hidden-mobile">
        <button className="admin-btn" onClick={() => setIsAdmin(true)}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Admin Panel
        </button>
      </div>
    </div>
  );
};

export default App;

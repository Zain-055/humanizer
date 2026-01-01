class TextHumanizer {
    constructor() {
        // Store element references
        this.elements = {};
        this.debounceTimer = null;
        this.debounceMs = 600;
        
        // Initialize after DOM is ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initialize());
        } else {
            this.initialize();
        }
    }
    
    initialize() {
        this.elements.aiInput = document.getElementById('aiInput');
        this.elements.humanizeButton = document.getElementById('humanizeButton');
        this.elements.copyButton = document.getElementById('copyButton');
        this.elements.clearButton = document.getElementById('clearButton');
        this.elements.humanOutput = document.getElementById('humanOutput');
        this.elements.charCount = document.getElementById('charCount');
        this.elements.processingTime = document.getElementById('processingTime');
        this.elements.intensitySelect = document.getElementById('intensitySelect');
        this.elements.toneSelect = document.getElementById('toneSelect');
        this.elements.scanOverlay = document.getElementById('scanOverlay');
        this.elements.scanText = document.getElementById('scanText');
        this.elements.container = document.querySelector('.converter-container');
        this.elements.detectTab = document.getElementById('detectTab');
        this.elements.humanizeTab = document.getElementById('humanizeTab');
        this.elements.outputTitle = document.getElementById('outputTitle');
        this.elements.humanizeOutputContainer = document.getElementById('humanizeOutputContainer');
        this.elements.detectorContainer = document.getElementById('detectorContainer');
        this.elements.aiScoreValue = document.getElementById('aiScoreValue');
        this.elements.humanScoreValue = document.getElementById('humanScoreValue');
        this.elements.aiScoreBar = document.getElementById('aiScoreBar');
        this.elements.humanScoreBar = document.getElementById('humanScoreBar');
        this.elements.detectorSummary = document.getElementById('detectorSummary');
        this.elements.example1 = document.getElementById('example1');
        this.elements.example2 = document.getElementById('example2');
        this.elements.exportReport = document.getElementById('exportReport');
        this.elements.rewriteRisk = document.getElementById('rewriteRisk');
        this.elements.themeSelect = document.getElementById('themeSelect');
        this.elements.keepTerms = document.getElementById('keepTerms');
        
        this.scanTimer = null;
        this.currentMode = 'detect';
        
        // Check if all elements exist
        if (!this.allElementsExist()) {
            console.error('Some DOM elements are missing');
            return;
        }
        
        this.restoreState();
        this.init();
    }
    
    allElementsExist() {
        const required = [
            'aiInput',
            'humanizeButton',
            'copyButton',
            'clearButton',
            'humanOutput',
            'charCount',
            'processingTime',
            'intensitySelect',
            'toneSelect',
            'detectorContainer',
            'humanizeOutputContainer',
            'detectTab',
            'humanizeTab',
            'outputTitle',
            'aiScoreValue',
            'humanScoreValue',
            'aiScoreBar',
            'humanScoreBar',
            'detectorSummary',
            'container'
        ];
        return required.every(key => this.elements[key]);
    }
    
    init() {
        this.elements.humanizeButton.addEventListener('click', () => {
            if (this.currentMode === 'detect') {
                this.detectAI();
            } else {
                this.humanizeText();
            }
        });
        this.elements.copyButton.addEventListener('click', () => this.copyResult());
        this.elements.clearButton.addEventListener('click', () => this.clearAll());
        this.elements.aiInput.addEventListener('input', () => {
            this.updateCharCount();
            this.saveState();
            if (this.currentMode === 'detect') {
                this.queueDebouncedDetect();
            }
        });
        this.elements.intensitySelect.addEventListener('change', () => {
            this.updateCharCount();
            this.saveState();
        });
        if (this.elements.toneSelect) {
            this.elements.toneSelect.addEventListener('change', () => {
                this.updateCharCount();
                this.saveState();
            });
        }
        if (this.elements.detectTab && this.elements.humanizeTab) {
            this.elements.detectTab.addEventListener('click', () => {
                this.switchMode('detect');
                this.saveState();
            });
            this.elements.humanizeTab.addEventListener('click', () => {
                this.switchMode('humanize');
                this.saveState();
            });
        }
        if (this.elements.example1) {
            this.elements.example1.addEventListener('click', () => this.loadExample(1));
        }
        if (this.elements.example2) {
            this.elements.example2.addEventListener('click', () => this.loadExample(2));
        }
        if (this.elements.exportReport) {
            this.elements.exportReport.addEventListener('click', () => this.exportReport());
        }
        if (this.elements.rewriteRisk) {
            this.elements.rewriteRisk.addEventListener('click', () => this.rewriteHighRisk());
        }
        if (this.elements.themeSelect) {
            this.elements.themeSelect.addEventListener('change', () => {
                this.applyTheme();
                this.saveState();
            });
        }
        if (this.elements.keepTerms) {
            this.elements.keepTerms.addEventListener('input', () => {
                this.saveState();
            });
        }
        
        this.updateCharCount();
        this.switchMode('detect');
    }
    
    queueDebouncedDetect() {
        if (this.debounceTimer) {
            clearTimeout(this.debounceTimer);
        }
        const text = this.elements.aiInput.value.trim();
        if (!text) {
            return;
        }
        this.debounceTimer = setTimeout(() => {
            this.detectAI();
        }, this.debounceMs);
    }
    
    saveState() {
        try {
            const state = {
                input: this.elements.aiInput.value,
                intensity: this.elements.intensitySelect.value,
                tone: (this.elements.toneSelect && this.elements.toneSelect.value) || 'casual',
                theme: (this.elements.themeSelect && this.elements.themeSelect.value) || 'green',
                keepTerms: (this.elements.keepTerms && this.elements.keepTerms.value) || '',
                mode: this.currentMode
            };
            localStorage.setItem('humanlify_state', JSON.stringify(state));
        } catch (_) {}
    }
    
    restoreState() {
        try {
            const raw = localStorage.getItem('humanlify_state');
            if (!raw) return;
            const state = JSON.parse(raw);
            if (state && typeof state === 'object') {
                if (typeof state.input === 'string') this.elements.aiInput.value = state.input;
                if (typeof state.intensity === 'string') this.elements.intensitySelect.value = state.intensity;
                if (this.elements.toneSelect && typeof state.tone === 'string') this.elements.toneSelect.value = state.tone;
                if (this.elements.themeSelect && typeof state.theme === 'string') this.elements.themeSelect.value = state.theme;
                if (this.elements.keepTerms && typeof state.keepTerms === 'string') this.elements.keepTerms.value = state.keepTerms;
                if (state.mode === 'detect' || state.mode === 'humanize') this.currentMode = state.mode;
                this.applyTheme();
            }
        } catch (_) {}
    }
    
    updateCharCount() {
        const text = this.elements.aiInput.value;
        this.elements.charCount.textContent = `${text.length} characters`;
    }
    
    humanizeText() {
        const aiText = this.elements.aiInput.value.trim();
        if (!aiText) {
            this.showError('Please enter some AI-generated text first');
            return;
        }
        
        this.setLoading(true);
        const startTime = performance.now();

        let beforeDetection = null;
        try {
            beforeDetection = this.analyzeAIConfidence(aiText);
        } catch (e) {
            beforeDetection = null;
        }

        let intensity = this.getIntensity();
        if (beforeDetection) {
            if (beforeDetection.aiScore >= 70) {
                intensity = 'strong';
            } else if (beforeDetection.aiScore >= 45 && intensity === 'light') {
                intensity = 'medium';
            }
        }
        
        // Simulate processing delay for better UX
        setTimeout(() => {
            try {
                const humanizedText = this.processText(aiText, intensity, this.getTone());
                const endTime = performance.now();
                const processingTime = (endTime - startTime).toFixed(0);

                let afterDetection = null;
                try {
                    afterDetection = this.analyzeAIConfidence(humanizedText);
                } catch (e) {
                    afterDetection = null;
                }
                
                this.elements.humanOutput.textContent = humanizedText;

                if (beforeDetection && afterDetection) {
                    this.elements.processingTime.textContent = `AI score ${beforeDetection.aiScore}% → ${afterDetection.aiScore}% in ${processingTime}ms`;
                } else {
                    this.elements.processingTime.textContent = `Processed in ${processingTime}ms`;
                }
                this.elements.processingTime.className = 'success';
                
                this.setLoading(false);
            } catch (error) {
                this.showError('Error processing text');
                this.setLoading(false);
            }
        }, 500);
    }

    detectAI() {
        const inputText = this.elements.aiInput.value.trim();
        if (!inputText) {
            this.showError('Please enter some text to analyze');
            return;
        }
        
        this.setLoading(true);
        const startTime = performance.now();
        
        setTimeout(() => {
            try {
                const result = this.analyzeAIConfidence(inputText);
                this.updateDetectorUI(result);
                const endTime = performance.now();
                const processingTime = (endTime - startTime).toFixed(0);
                this.elements.processingTime.textContent = `Analyzed in ${processingTime}ms`;
                this.elements.processingTime.className = 'success';
                this.setLoading(false);
            } catch (error) {
                this.showError('Error analyzing text');
                this.setLoading(false);
            }
        }, 500);
    }
    
    getIntensity() {
        const value = this.elements.intensitySelect.value;
        if (value === 'light' || value === 'medium' || value === 'strong') {
            return value;
        }
        return 'medium';
    }
    
    getTone() {
        const value = (this.elements.toneSelect && this.elements.toneSelect.value) || 'casual';
        if (value === 'casual' || value === 'professional' || value === 'academic') {
            return value;
        }
        return 'casual';
    }

    switchMode(mode) {
        if (mode !== 'detect' && mode !== 'humanize') {
            return;
        }
        this.currentMode = mode;
        if (this.elements.detectTab && this.elements.humanizeTab) {
            if (mode === 'detect') {
                this.elements.detectTab.classList.add('active');
                this.elements.humanizeTab.classList.remove('active');
            } else {
                this.elements.humanizeTab.classList.add('active');
                this.elements.detectTab.classList.remove('active');
            }
        }
        if (this.elements.humanizeOutputContainer && this.elements.detectorContainer) {
            if (mode === 'detect') {
                this.elements.humanizeOutputContainer.style.display = 'none';
                this.elements.detectorContainer.style.display = 'block';
            } else {
                this.elements.humanizeOutputContainer.style.display = 'block';
                this.elements.detectorContainer.style.display = 'none';
            }
        }
        if (this.elements.outputTitle) {
            this.elements.outputTitle.textContent = mode === 'detect' ? 'Detection console' : 'Output buffer';
        }
        if (this.elements.humanizeButton) {
            this.elements.humanizeButton.textContent = mode === 'detect' ? 'Detect AI' : 'Humanize Text';
        }
        if (this.elements.intensitySelect) {
            this.elements.intensitySelect.parentElement.style.display = mode === 'humanize' ? 'flex' : 'none';
        }
        if (mode === 'detect' && this.elements.detectorSummary) {
            this.elements.detectorSummary.textContent = 'Paste text and run detection to see how AI-like it looks.';
        }
        if (mode === 'humanize' && this.elements.humanOutput) {
            if (!this.elements.humanOutput.textContent || this.elements.humanOutput.textContent === 'Humanized text will appear here after decryption.') {
                this.elements.humanOutput.textContent = 'Your humanized text will appear here...';
            }
        }
        this.saveState();
    }

    analyzeAIConfidence(text) {
        const normalized = String(text || '').replace(/\s+/g, ' ').trim();
        const length = normalized.length;
        const sentenceList = normalized.split(/(?<=[.!?])\s+/).map(s => s.trim()).filter(Boolean);
        const words = normalized.split(/\s+/).filter(Boolean);
        const avgSentenceLength = sentenceList.length ? words.length / sentenceList.length : words.length;

        const reasons = [];
        let score = 0;

        const addReason = (reason) => {
            if (!reasons.includes(reason)) {
                reasons.push(reason);
            }
        };

        const indicators = [
            // Explicit AI Detection (High Weight)
            { pattern: /\b(as an AI language model|as an AI|as a language model|AI model|AI assistant|I'm an AI|I am an AI|this AI|the AI|large language model|LLM|GPT|ChatGPT|Claude|Bard|Gemini)\b/gi, weight: 85, reason: 'Explicit AI model phrasing detected' },
            { pattern: /\b(I do not have (personal )?opinions|I do not have access to real-time data|I cannot provide real-time information|my knowledge is limited to|my training data only goes up to|I don't have personal experiences|I lack personal experiences|I cannot access current information)\b/gi, weight: 55, reason: 'Common AI capability disclaimer' },
            { pattern: /\b(I am unable to|I cannot|I can not) (browse the internet|access the internet|access external data|perform real-time searches|access current information|provide real-time data|browse the web|access live data)\b/gi, weight: 50, reason: 'AI browsing limitation disclaimer' },
            { pattern: /\b(my (programming|training|knowledge) (prevents|limits|restricts)|I am (programmed|trained|designed) to|I (cannot|can't) (provide|give|access|browse))\b/gi, weight: 60, reason: 'AI programming limitation language' },
            
            // Academic & Professional AI Patterns (Very High Weight)
            { pattern: /\b(it is important to note that|it is worth noting that|this suggests that|this indicates that|this implies|this means that|it should be emphasized that|it is crucial to understand that|it must be noted that|it should be pointed out that)\b/gi, weight: 25, reason: 'Template-like academic explanation phrasing' },
            { pattern: /\b(in conclusion|in summary|overall|moreover|furthermore|additionally|to summarize|to conclude|in summation|to encapsulate)\b/gi, weight: 18, reason: 'Formal essay-style connectors' },
            { pattern: /\b(however|therefore|thus|hence|consequently|accordingly|subsequently|ergo|wherefore|as a consequence)\b/gi, weight: 20, reason: 'High-level logical connectors' },
            { pattern: /\b(please note that|kindly be advised that|it is recommended that|it is suggested that|one should consider|it is advisable that|it is imperative that)\b/gi, weight: 30, reason: 'AI instructional phrasing' },
            { pattern: /\b(based on the information provided|according to the data|per the request|as per the query|given the context|considering the information)\b/gi, weight: 35, reason: 'AI response framing' },
            { pattern: /\b(I hope this helps|let me know if you need further assistance|feel free to ask|is there anything else|I'd be happy to help|please let me know if you need anything else)\b/gi, weight: 40, reason: 'AI assistant closing phrases' },
            { pattern: /\b(in a nutshell|to put it simply|essentially|basically|fundamentally|in simple terms|to simplify|put simply)\b/gi, weight: 22, reason: 'Simplification markers' },
            { pattern: /\b(this (article|paper|essay|analysis|discussion) (will|aims to|seeks to|attempts to|endeavors to)|the purpose of this|this discussion will|this study will)\b/gi, weight: 28, reason: 'Academic paper framing' },
            
            // Advanced Academic Vocabulary (High Weight)
            { pattern: /\b(utilize|approximately|demonstrate|nevertheless|subsequently|primarily|frequently|predominantly|comprehensive|fundamental|beneficial|various|optimal|efficient|effectively|considerable|objective|methodology|illustrate|highlight|indicate|facilitate|implement|regarding|evaluate|assessment|analysis|leverage|optimize|enhance|robust|seamless|holistic|nuanced|paradigm|synergy|actionable|strategic|systematic|rigorous|substantial|significant|notable|prominent|subtle|intricate|complex|sophisticated|elaborate|detailed|thorough|exhaustive|comprehensive|extensive|widespread|prevalent|commonplace|ubiquitous)\b/gi, weight: 15, reason: 'High-formality academic vocabulary' },
            { pattern: /\b(as a result|in order to|for example|in other words|due to the fact that|taking into consideration|with regard to|in terms of|on the basis of|with respect to|in relation to|in reference to)\b/gi, weight: 20, reason: 'Template-like academic phrases' },
            { pattern: /\b(in today's world|in recent years|nowadays|at the end of the day|in the modern era|in contemporary society|in the current climate|in today's society|in the present day)\b/gi, weight: 25, reason: 'Generic filler framing' },
            
            // Complex Academic Structures (Very High Weight)
            { pattern: /\b(it is (quite|extremely|particularly|especially|remarkably|notably) (important|significant|crucial|vital|essential|critical) (to note|to understand|to consider|to recognize|to acknowledge))\b/gi, weight: 35, reason: 'Complex academic emphasis structure' },
            { pattern: /\b(this (raises|brings up|presents|introduces|highlights|emphasizes|underscores|illustrates|demonstrates|reveals|shows|indicates|suggests|implies) (an important|a significant|a crucial|a critical|a key|a fundamental) (point|issue|aspect|element|factor|consideration))\b/gi, weight: 40, reason: 'Academic analytical framing' },
            { pattern: /\b(it (should|must|needs to) (be noted|be pointed out|be emphasized|be highlighted|be mentioned|be acknowledged|be recognized) that)\b/gi, weight: 45, reason: 'Academic obligation framing' },
            { pattern: /\b(this (is|represents|constitutes|embodies|exemplifies|illustrates|demonstrates|shows|reveals|indicates|suggests) (an example of|a case of|a form of|a type of|a kind of|a manifestation of|an instance of))\b/gi, weight: 38, reason: 'Academic exemplification structure' },
            
            // Research & Analysis Language (High Weight)
            { pattern: /\b(according to the research|research has shown|studies have indicated|data suggests|evidence points to|findings demonstrate|results indicate|analysis reveals)\b/gi, weight: 32, reason: 'Research citation patterns' },
            { pattern: /\b(from a (theoretical|practical|conceptual|methodological|analytical|critical) (perspective|standpoint|viewpoint|angle|approach|lens))\b/gi, weight: 35, reason: 'Academic perspective framing' },
            { pattern: /\b(in the (context|framework|scope|realm|domain|field|area|sphere) of|within the (context|framework|scope|realm|domain|field|area|sphere) of)\b/gi, weight: 30, reason: 'Academic contextual framing' },
            { pattern: /\b(this (phenomenon|concept|idea|notion|principle|theory|hypothesis|assumption|premise) (is|can be|may be|might be) (seen|viewed|understood|interpreted|perceived|considered|regarded) as)\b/gi, weight: 42, reason: 'Academic conceptual analysis' },
            
            // Comparative & Contrastive Structures (High Weight)
            { pattern: /\b(on the one hand|on the other hand|conversely|in contrast|by contrast|alternatively|whereas|while|whilst|although|though|even though|despite the fact that)\b/gi, weight: 25, reason: 'Academic comparative structures' },
            { pattern: /\b(similarly|likewise|in the same way|in a similar manner|by the same token|equally|comparatively|relatively)\b/gi, weight: 20, reason: 'Academic similarity markers' },
            { pattern: /\b(more (importantly|significantly|notably|remarkably|interestingly|crucially|critically|fundamentally|substantially))\b/gi, weight: 28, reason: 'Academic comparative emphasis' },
            
            // Temporal & Sequential Markers (Medium Weight)
            { pattern: /\b(firstly|secondly|thirdly|fourthly|fifthly|initially|subsequently|eventually|finally|ultimately|eventually)\b/gi, weight: 18, reason: 'Academic sequential markers' },
            { pattern: /\b(at the same time|simultaneously|concurrently|meanwhile|in the meantime|during this time|at this point)\b/gi, weight: 22, reason: 'Academic temporal coordination' },
            { pattern: /\b(prior to|preceding|previous to|beforehand|earlier|previously|formerly)\b/gi, weight: 20, reason: 'Academic temporal precedence' },
            
            // Conditional & Hypothetical (High Weight)
            { pattern: /\b(if (this is|this were|this is) the case|under these circumstances|in such a situation|given these conditions|in this scenario)\b/gi, weight: 35, reason: 'Academic conditional framing' },
            { pattern: /\b(this (would|could|might|may) (suggest|indicate|imply|mean|show|demonstrate|reveal|illustrate|highlight))\b/gi, weight: 30, reason: 'Academic hypothetical analysis' },
            { pattern: /\b(should (this be|this prove|this turn out|this happen|this occur|this arise))\b/gi, weight: 40, reason: 'Academic conditional inversion' },
            
            // Quantitative & Statistical Language (High Weight)
            { pattern: /\b(a (significant|substantial|considerable|marked|notable|dramatic|sharp|rapid|gradual|steady) (increase|decrease|rise|fall|decline|growth|reduction|change|shift|improvement|decline))\b/gi, weight: 45, reason: 'Quantitative trend description' },
            { pattern: /\b(an (overwhelming|vast|large|significant|substantial|considerable|marked) (majority|minority|proportion|number|amount|percentage|fraction))\b/gi, weight: 42, reason: 'Statistical proportion language' },
            { pattern: /\b((approximately|roughly|about|around|nearly|almost|over|under|more than|less than) \d+(\.\d+)?(%| percent| percentage))\b/gi, weight: 35, reason: 'Statistical percentage expressions' },
            
            // Causation & Result Language (High Weight)
            { pattern: /\b(this (leads to|results in|causes|produces|generates|creates|triggers|initiates|gives rise to|brings about))\b/gi, weight: 38, reason: 'Causal relationship markers' },
            { pattern: /\b(this (is due to|can be attributed to|stems from|derives from|results from|arises from|originates from))\b/gi, weight: 40, reason: 'Causal attribution patterns' },
            { pattern: /\b(as a (direct|indirect|immediate|inevitable|natural|logical|necessary) (result|consequence|outcome|effect|impact))\b/gi, weight: 45, reason: 'Result specification patterns' },
            
            // Definition & Explanation (High Weight)
            { pattern: /\b(this (term|concept|notion|idea|definition|phrase|expression|word) (refers to|denotes|signifies|means|indicates|designates|represents))\b/gi, weight: 35, reason: 'Definition explanation patterns' },
            { pattern: /\b(can be (defined as|described as|characterized as|understood as|interpreted as|seen as|viewed as|regarded as))\b/gi, weight: 32, reason: 'Definition characterization patterns' },
            { pattern: /\b(in (other|simpler|layman's|basic|general|broad) (terms|words|language))\b/gi, weight: 30, reason: 'Explanation simplification patterns' },
            
            // Emphasis & Intensification (Medium Weight)
            { pattern: /\b(it (is|was) (clear|evident|obvious|apparent|plain|manifest) (that|from))\b/gi, weight: 28, reason: 'Emphatic observation patterns' },
            { pattern: /\b(what (is|was) (particularly|especially|notably|remarkably|especially) (important|significant|crucial|critical|notable|interesting))\b/gi, weight: 35, reason: 'Selective emphasis patterns' },
            { pattern: /\b(it (should|must|needs to) (be|be made) (clear|evident|obvious|plain|manifest))\b/gi, weight: 38, reason: 'Obligation clarity patterns' },

            { pattern: /\b(the purpose of this (article|paper|essay|section|chapter) (is|will be|is to|will)|this (article|paper|essay|section|chapter) (examines|explores|discusses|considers|investigates)|this section (examines|explores|discusses|considers|investigates))\b/gi, weight: 32, reason: 'Formal academic structural framing' },
            { pattern: /\b(it is (widely|generally|commonly|broadly) (accepted|acknowledged|recognized|understood|believed) that)\b/gi, weight: 30, reason: 'Generic consensus statements' },
            { pattern: /\b(first and foremost|to begin with|at the outset|from the outset|to start with)\b/gi, weight: 20, reason: 'Formulaic rhetorical openers' },
            { pattern: /\b(it can be (argued|contended|maintained|asserted|claimed) that)\b/gi, weight: 30, reason: 'Academic argument hedging' },
            { pattern: /\b(it is (also )?(essential|important|necessary|critical|vital) to (note|recognize|acknowledge|consider|understand) that)\b/gi, weight: 34, reason: 'Expanded academic emphasis templates' },
            { pattern: /\b(in this (essay|paper|article|section|chapter|analysis|discussion))\b/gi, weight: 22, reason: 'Self-referential academic framing' },
            { pattern: /\b(the following (section|sections|chapter|chapters|discussion|analysis) (will|examines|explores|discusses|considers|investigates))\b/gi, weight: 26, reason: 'Forward-looking academic structure' },
            { pattern: /\b(as previously (mentioned|noted|discussed|stated|outlined)|as (noted|mentioned|discussed|stated) (above|earlier|previously))\b/gi, weight: 24, reason: 'Cross-referential academic signposting' },
            { pattern: /\b(this (demonstrates|highlights|underscores|illustrates|emphasizes|confirms|reinforces) the (importance|significance|relevance|impact|value) of)\b/gi, weight: 36, reason: 'Analytical result interpretation patterns' },
            { pattern: /\b(plays? (a )?(crucial|critical|important|significant|key|pivotal) role (in|for)|is (of|of particular|of great) (importance|significance) (in|for))\b/gi, weight: 34, reason: 'Overused importance metaphors' }
        ];

        indicators.forEach(item => {
            const matches = normalized.match(item.pattern);
            if (matches && matches.length) {
                score += item.weight * Math.min(matches.length, 3);
                addReason(item.reason);
            }
        });

        const lowerTextExpanded = normalized.toLowerCase();
        const prepositionBundles = '(in terms of|with respect to|in relation to|with regard to|on the basis of|in the context of|in the case of|in the presence of|in the absence of|in the face of|in light of|in view of|by virtue of|by means of|in conjunction with|in comparison with|in contrast to|with reference to|in accordance with|in compliance with|in conformity with|in line with|consistent with|compatible with|aligned with|as a result of|as a consequence of|as opposed to|as part of|as well as|in connection with|from the perspective of|from the standpoint of|from the viewpoint of|from the angle of|in proximity to|in parallel with)';
        const academicNouns = '(data|the data|the findings|findings|the results|results|the evidence|evidence|this study|this paper|this analysis|the research|the literature|the model|the framework|the approach|the method|the methodology|the experiment|the hypothesis|the theory|the concept|the notion|the idea|the argument|the premise|the dataset|the corpus|the sample|the participants|the subjects)';
        const reportingSubjects = '(this|this study|this paper|this analysis|the study|the paper|the analysis|the results|results|the data|data|the findings|findings|the evidence|evidence)';
        const reportingVerbs = '(suggests|indicates|implies|demonstrates|shows|reveals|illustrates|confirms|validates|corroborates|supports|underscores|highlights|points to|signals)';
        const reportingTail = '(that|that\s+the|that\s+this|that\s+there|the presence of|the absence of)';
        const causeBundle = '(leads to|results in|gives rise to|brings about|contributes to|is due to|can be attributed to|stems from|arises from|derives from)';
        const degreeAdverbs = '(extremely|highly|particularly|especially|remarkably|notably|significantly|substantially|considerably|markedly|dramatically|sharply|rapidly|gradually|steadily|consistently|frequently|commonly|generally|typically|often|usually|increasingly|decreasingly)';
        const academicAdjectivesGroup = '(important|significant|crucial|critical|essential|vital|necessary|relevant|appropriate|suitable|effective|efficient|optimal|ideal|clear|evident|obvious|apparent|plain|manifest|transparent|conspicuous|noticeable|visible|perceptible|detectable|observable|measurable|quantifiable|tangible|substantial|considerable|marked|dramatic|sharp|rapid|gradual|steady|consistent|frequent|common|general|typical|usual|increasing|decreasing)';

        const comboPatterns = [
            { re: new RegExp(`\\b${prepositionBundles}\\s+${academicNouns}\\b`, 'gi'), weight: 6, reason: 'Expanded academic lexical bundles' },
            { re: new RegExp(`\\b${reportingSubjects}\\s+${reportingVerbs}\\s+${reportingTail}\\b`, 'gi'), weight: 7, reason: 'Expanded reporting-verb constructions' },
            { re: new RegExp(`\\b(it is|it was)\\s+${degreeAdverbs}?\\s*${academicAdjectivesGroup}\\s+(to|that)\\b`, 'gi'), weight: 7, reason: 'Expanded academic emphasis frames' },
            { re: new RegExp(`\\b(as a|as an|as the)\\s+(result|consequence)\\s+of\\s+${academicNouns}\\b`, 'gi'), weight: 6, reason: 'Expanded cause-result bundles' },
            { re: new RegExp(`\\b${academicNouns}\\s+${causeBundle}\\b`, 'gi'), weight: 6, reason: 'Expanded causal attribution bundles' }
        ];
        comboPatterns.forEach(item => {
            const m = normalized.match(item.re);
            if (m && m.length) {
                score += item.weight * Math.min(m.length, 5);
                addReason(item.reason);
            }
        });

        if (words.length > 70) {
            const statsPhrases = [
                'statistically significant','confidence interval','p-value','standard deviation','standard error','variance','covariance','regression analysis','linear regression','logistic regression','multiple regression','correlation coefficient','pearson correlation','spearman correlation','sample size','randomized','double-blind','placebo-controlled','meta-analysis','systematic review','literature review','case study','case-control','cohort study','cross-sectional','longitudinal study','experimental design','study design','data collection','data analysis','data preprocessing','feature extraction','feature selection','principal component analysis','k-means clustering','hierarchical clustering','time series','survival analysis','bayesian analysis','maximum likelihood','null hypothesis','alternative hypothesis','hypothesis testing','chi-square test','t-test','anova','ancova','manova','f-test','z-test','wilcoxon test','mann-whitney','kruskal-wallis','effect size','power analysis','type i error','type ii error','alpha level','beta error','false positive','false negative','precision','recall','f1-score','area under the curve','roc curve','auc','mean squared error','root mean squared error','mean absolute error','r-squared','adjusted r-squared','residual analysis','goodness of fit','cross-validation','k-fold','holdout set','train test split','overfitting','underfitting','regularization','lasso','ridge regression','elastic net','gradient descent','stochastic gradient','learning rate','early stopping','grid search','random search','hyperparameter tuning','confusion matrix','class imbalance','stratified sampling','bootstrapping','resampling','jackknife','bias variance tradeoff','normal distribution','gaussian','uniform distribution','poisson','binomial','bernoulli','log-likelihood','information criterion','aic','bic'
            ];
            let statsHits = 0;
            for (let i = 0; i < statsPhrases.length; i++) {
                if (lowerTextExpanded.indexOf(statsPhrases[i]) !== -1) statsHits++;
            }
            if (statsHits >= 4) {
                score += Math.min(20, statsHits * 2);
                addReason('Statistical and research-reporting lexicon');
            }

            const methodPhrases = [
                'we used','we use','we applied','we apply','we employed','we employ','we adopted','we adopt','we propose','we proposed','we present','we presented','we develop','we developed','we design','we designed','this method','this approach','the proposed method','the proposed approach','the proposed model','state-of-the-art','baseline method','baseline model','experimental results','empirical results','quantitative results','qualitative results','ablation study','sensitivity analysis','robustness check','error analysis','implementation details','computational complexity','time complexity','space complexity','memory footprint','runtime performance','throughput','latency','scalability','generalization ability','transfer learning','domain adaptation','fine-tuning','pretrained model','pre-trained model','training data','test data','validation set','training set','test set','dev set','ground truth','gold standard','benchmark dataset','open-source','code is available','publicly available','reproducible','reproducibility','experimental setup','hyperparameters','learning objective','loss function','optimization algorithm','regularization term','batch size','epochs','iterations','convergence','stability','parameter tuning','model selection','early stopping','weight decay','dropout','data augmentation','preprocessing pipeline','postprocessing','evaluation metrics'
            ];
            let methodHits = 0;
            for (let i = 0; i < methodPhrases.length; i++) {
                if (lowerTextExpanded.indexOf(methodPhrases[i]) !== -1) methodHits++;
            }
            if (methodHits >= 4) {
                score += Math.min(18, methodHits * 2);
                addReason('Methods and implementation phrasing');
            }

            const bundlePhrases = [
                'in summary','in conclusion','to summarize','to conclude','to sum up','in short','in brief','at the end of the day','overall','taken together','collectively','from this perspective','from this standpoint','from this viewpoint','from this angle','as previously mentioned','as mentioned earlier','as noted earlier','as discussed earlier','as shown above','as shown below','as described above','as described below','it is important to note that','it is worth noting that','it should be noted that','it must be noted that','it is essential to recognize that','it is crucial to understand that','it is necessary to consider','it is clear that','it is evident that','it is apparent that','it is obvious that','it becomes clear that','one can observe that','one can see that','we observe that','we note that','we find that','the results show that','the results indicate that','the findings suggest that','the analysis reveals that','the evidence suggests that','the data indicate that','the data suggest that','there is evidence that','there is a tendency to','there is a need to','there is a lack of','there exists a','it can be seen that','it can be observed that','it can be argued that','it could be argued that','it may be argued that','it might be argued that','it can be concluded that','it can be inferred that','it follows that','this means that','this suggests that','this indicates that','this implies that','this demonstrates that','this shows that','this reveals that','this highlights that','this underscores that','this points to the fact that'
            ];
            let bundleHits = 0;
            for (let i = 0; i < bundlePhrases.length; i++) {
                if (lowerTextExpanded.indexOf(bundlePhrases[i]) !== -1) bundleHits++;
            }
            if (bundleHits >= 6) {
                score += Math.min(24, bundleHits * 2);
                addReason('Expanded academic lexical bundles');
            }
        }

        let contractionRatio = 0;
        let slangHits = 0;
        if (words.length) {
            const lowerWords = words.map(w => w.toLowerCase());
            const contractionCount = lowerWords.filter(w => /[a-z]'.+/.test(w)).length;
            contractionRatio = contractionCount / lowerWords.length;
            const slangPatterns = [
                /\bkinda\b/,
                /\bsorta\b/,
                /\bpretty\b/,
                /\ba bit\b/,
                /\bstuff\b/,
                /\btons of\b/,
                /\ba lot of\b/,
                /\bjust\b/,
                /\bguys\b/,
                /\bgonna\b/,
                /\bwanna\b/
            ];
            const loweredText = normalized.toLowerCase();
            slangPatterns.forEach(p => {
                if (p.test(loweredText)) slangHits += 1;
            });
        }

        if (sentenceList.length) {
            const sentenceLengths = sentenceList.map(s => s.split(/\s+/).filter(Boolean).length);
            const mean = avgSentenceLength || 0;
            const variance = sentenceLengths.reduce((sum, len) => {
                const diff = len - mean;
                return sum + diff * diff;
            }, 0) / sentenceLengths.length;
            const stdDev = Math.sqrt(variance);

            if (sentenceLengths.length >= 4 && stdDev <= 4.2 && mean >= 14) {
                score += 14;
                addReason('Very uniform sentence rhythm');
            } else if (sentenceLengths.length >= 4 && stdDev >= 10) {
                score -= 6;
            }

            if (mean > 26) {
                score += Math.min(22, (mean - 26) * 1.3);
                addReason('Very long average sentence length');
            } else if (mean > 19) {
                score += Math.min(14, (mean - 19) * 1.0);
                addReason('Moderately long sentence structure');
            }

            const starters = sentenceList
                .map(s => s.toLowerCase().replace(/^[^a-z0-9]+/g, '').split(/\s+/).slice(0, 3).join(' '))
                .filter(Boolean);
            const starterCounts = new Map();
            starters.forEach(st => starterCounts.set(st, (starterCounts.get(st) || 0) + 1));
            const repeatedStarters = Array.from(starterCounts.values()).filter(v => v >= 2).reduce((a, b) => a + b, 0);
            const starterRepeatRatio = starters.length ? repeatedStarters / starters.length : 0;
            if (starterRepeatRatio >= 0.35 && starters.length >= 5) {
                score += 10;
                addReason('Repeated sentence starters');
            }
        }

        if (words.length > 60) {
            const cleaned = words.map(w => w.toLowerCase().replace(/[^a-z0-9']/g, '')).filter(Boolean);
            const bigramCounts = new Map();
            for (let i = 0; i < cleaned.length - 1; i++) {
                const bg = `${cleaned[i]} ${cleaned[i + 1]}`;
                bigramCounts.set(bg, (bigramCounts.get(bg) || 0) + 1);
            }
            const repeatedBigramTokens = Array.from(bigramCounts.values()).filter(v => v >= 2).reduce((a, b) => a + b, 0);
            const bigramRepeatRatio = cleaned.length ? repeatedBigramTokens / cleaned.length : 0;
            if (bigramRepeatRatio >= 0.06) {
                score += 10;
                addReason('Reused phrasing patterns');
            }
        }

        if (words.length > 40) {
            const longWords = words.filter(w => w.replace(/[^a-zA-Z]/g, '').length >= 7);
            const longRatio = longWords.length / words.length;
            if (longRatio > 0.36) {
                score += 10;
                addReason('Many long, formal-looking words');
            }
        }

        // Advanced AI pattern detection - Enhanced Statistical Analysis
        if (words.length > 50) {
            // Enhanced sentence complexity analysis for superior AI detection
            const sentenceComplexities = sentenceList.map(sentence => {
                const clauses = sentence.split(/[,;]/).length;
                const wordsInSentence = sentence.split(/\s+/).length;
                const subordinateClauses = (sentence.match(/\b(that|which|who|when|where|why|how|because|since|although|though|while|if|unless|provided that|given that)\b/gi) || []).length;
                const participialPhrases = (sentence.match(/\b\w+ing\b/gi) || []).length;
                const relativeClauses = (sentence.match(/\b(which|that|who|whom|whose)\s+(?:is|are|was|were|has been|have been|had been)\b/gi) || []).length;
                return { 
                    clauses, 
                    words: wordsInSentence, 
                    subordinateClauses, 
                    participialPhrases,
                    relativeClauses,
                    complexityScore: clauses + subordinateClauses + (participialPhrases * 0.5) + (relativeClauses * 0.8)
                };
            });
            
            const avgComplexity = sentenceComplexities.reduce((sum, c) => sum + c.complexityScore, 0) / sentenceComplexities.length;
            const complexityVariance = sentenceComplexities.reduce((sum, c) => {
                return sum + Math.pow(c.complexityScore - avgComplexity, 2);
            }, 0) / sentenceComplexities.length;
            
            // AI creates unnaturally uniform complexity - enhanced detection
            if (complexityVariance < 0.25 && avgComplexity > 2.5 && sentenceList.length >= 6) {
                score += 15;
                addReason('Unnaturally uniform sentence complexity (Advanced AI signature)');
            }
            
            // Check for AI's tendency to maintain specific complexity patterns
            const highComplexitySentences = sentenceComplexities.filter(c => c.complexityScore > 4).length;
            const mediumComplexitySentences = sentenceComplexities.filter(c => c.complexityScore >= 2 && c.complexityScore <= 4).length;
            if (highComplexitySentences >= sentenceList.length * 0.6 && sentenceList.length >= 8) {
                score += 12;
                addReason('Consistently high sentence complexity (Premium AI pattern)');
            }
            if (mediumComplexitySentences >= sentenceList.length * 0.8 && sentenceList.length >= 6) {
                score += 10;
                addReason('Unnaturally consistent medium complexity (AI hallmark)');
            }
            
            // Advanced syntactic pattern analysis
            const avgSubordinateClauses = sentenceComplexities.reduce((sum, c) => sum + c.subordinateClauses, 0) / sentenceComplexities.length;
            const avgRelativeClauses = sentenceComplexities.reduce((sum, c) => sum + c.relativeClauses, 0) / sentenceComplexities.length;
            
            if (avgSubordinateClauses > 2.5 && complexityVariance < 0.4) {
                score += 8;
                addReason('Uniform subordinate clause usage (AI writing signature)');
            }
            if (avgRelativeClauses > 1.8 && complexityVariance < 0.3) {
                score += 7;
                addReason('Consistent relative clause patterns (AI grammar signature)');
            }
        }

        // Enhanced Grammatical Construction Analysis - Premium AI Detection
        if (words.length > 60) {
            // Advanced passive voice detection with AI-specific patterns
            const presentPassivePattern = /\b(is|are|was|were|has been|have been|had been)\s+(?:extensively|widely|frequently|commonly|generally|typically|often|usually|consistently|regularly|increasingly|decreasingly|significantly|substantially|considerably|markedly|dramatically|sharply|rapidly|gradually|steadily|consistently|frequently|commonly|generally|typically|often|usually)\s+\w+ed\b/gi;
            const futurePassivePattern = /\b(will be|shall be|would be|could be|might be|may be|should be|must be|can be)\s+(?:extensively|widely|frequently|commonly|generally|typically|often|usually|consistently|regularly|increasingly|decreasingly|significantly|substantially|considerably|markedly|dramatically|sharply|rapidly|gradually|steadily)\s+\w+ed\b/gi;
            const modalPassivePattern = /\b(should be|must be|can be|could be|might be|may be|would be|ought to be|needs to be|has to be|have to be)\s+\w+ed\b/gi;
            const perfectPassivePattern = /\b(has been|have been|had been|will have been|would have been|could have been|might have been|may have been)\s+(?:extensively|widely|frequently|commonly|generally|typically|often|usually|consistently|regularly)\s+\w+ed\b/gi;
            
            const presentPassiveMatches = normalized.match(presentPassivePattern) || [];
            const futurePassiveMatches = normalized.match(futurePassivePattern) || [];
            const modalPassiveMatches = normalized.match(modalPassivePattern) || [];
            const perfectPassiveMatches = normalized.match(perfectPassivePattern) || [];
            
            if (presentPassiveMatches.length > 2 || futurePassiveMatches.length > 1 || modalPassiveMatches.length > 3 || perfectPassiveMatches.length > 1) {
                score += 10;
                addReason('Advanced passive voice constructions (Premium AI signature)');
            }
            
            // Advanced nominalization detection - AI loves turning verbs into nouns
            const advancedNominalizations = normalized.match(/\b((?:ion|tion|sion|ness|ment|ity|ty|ance|ence|ancy|ency|cy|dom|hood|ship|age|al|ery|ry)\.?\b)/gi) || [];
            const nominalizationRatio = advancedNominalizations.length / (words.length || 1);
            
            // Check for specific AI-favored nominalization patterns
            const aiNominalizationPatterns = [
                /\b(utilization|implementation|optimization|enhancement|improvement|development|establishment|creation|generation|production|formation|construction|building|making)\b/gi,
                /\b(analysis|assessment|evaluation|examination|investigation|exploration|study|research|inquiry|query|questioning)\b/gi,
                /\b(consideration|examination|exploration|investigation|analysis|evaluation|assessment|review|overview|summary|conclusion)\b/gi,
                /\b(importance|significance|relevance|applicability|suitability|appropriateness|effectiveness|efficiency|optimality)\b/gi
            ];
            
            let aiNominalizationCount = 0;
            aiNominalizationPatterns.forEach(pattern => {
                const matches = normalized.match(pattern) || [];
                aiNominalizationCount += matches.length;
            });
            
            if (nominalizationRatio > 0.10 && words.length > 120) {
                score += 12;
                addReason('High academic nominalization density (Advanced AI pattern)');
            }
            if (aiNominalizationCount >= 6) {
                score += 8;
                addReason('AI-specific nominalization patterns detected');
            }
            
            // Advanced clause structure analysis
            const thatComplementClauses = normalized.match(/\b(that)\s+(?:is|are|was|were|has been|have been|had been|will be|would be|could be|might be|may be|should be|must be|can be)\s+(?:important|significant|crucial|critical|essential|vital|necessary|relevant|applicable|appropriate|suitable|effective|efficient|optimal|ideal|clear|evident|obvious|apparent|plain|manifest)\b/gi) || [];
            const relativeClauses = normalized.match(/\b(?:which|that|who|whom|whose)\s+(?:is|are|was|were|has been|have been|had been|will be|would be|could be|might be|may be|should be|must be|can be)\s+(?:important|significant|crucial|critical|essential|vital|necessary|relevant|applicable|appropriate|suitable|effective|efficient|optimal|ideal|clear|evident|obvious|apparent|plain|manifest)\b/gi) || [];
            const adverbialClauses = normalized.match(/\b(?:when|where|while|whereas|although|though|even though|despite|in spite of|because|since|as|if|unless|provided that|given that|considering that)\s+(?:this|that|these|those|it|they|we|you)\b/gi) || [];
            
            if (thatComplementClauses.length >= 2 || relativeClauses.length >= 3 || adverbialClauses.length >= 4) {
                score += 9;
                addReason('Complex clause structures (Premium AI grammar signature)');
            }
            
            // Check for AI's tendency to use specific adverbial patterns
            const sentenceAdverbials = normalized.match(/\b(?:moreover|furthermore|additionally|in addition|also|besides|likewise|similarly|conversely|however|nevertheless|nonetheless|on the other hand|in contrast|whereas|while|although|though|even though|despite|in spite of|therefore|thus|hence|consequently|as a result|accordingly|subsequently|finally|ultimately|eventually|initially|first|second|third|firstly|secondly|thirdly|finally|ultimately|eventually)\b/gi) || [];
            const adverbialDensity = sentenceAdverbials.length / (sentenceList.length || 1);
            
            if (adverbialDensity > 0.6 && sentenceList.length >= 6) {
                score += 11;
                addReason('High sentence adverbial density (Advanced AI coherence pattern)');
            }
        }

        // Advanced Statistical Text Analysis - Premium AI Detection
        if (words.length > 100) {
            // Enhanced transition word analysis for superior AI detection
            const advancedTransitionWords = normalized.match(/\b(furthermore|moreover|additionally|in addition|also|besides|likewise|similarly|conversely|however|nevertheless|nonetheless|on the other hand|in contrast|whereas|while|although|despite|in spite of|therefore|thus|hence|consequently|as a result|accordingly|subsequently|meanwhile|in the meantime|at the same time|simultaneously|concurrently|alternatively|instead|rather|on the contrary|by contrast|in comparison|compared to|relative to|with respect to|in relation to|regarding|concerning|with regard to|in terms of|in reference to|in connection with)\b/gi) || [];
            const transitionDensity = advancedTransitionWords.length / (sentenceList.length || 1);
            if (transitionDensity > 0.7 && sentenceList.length >= 6) {
                score += 14;
                addReason('Advanced transition word density (Premium AI coherence signature)');
            }
            
            // Enhanced balanced argument structure detection
            const advancedBalancedPatterns = normalized.match(/\b(on the one hand.*on the other hand|while.*however|although.*nevertheless|despite.*however|whereas.*however|conversely.*however|on the contrary.*however|by contrast.*however|in contrast.*however|alternatively.*however|instead.*however|rather.*however)\b/gi) || [];
            const conditionalBalancePatterns = normalized.match(/\b(if.*then|when.*then|should.*then|were.*then|had.*then)\b/gi) || [];
            const comparativeBalancePatterns = normalized.match(/\b(not only.*but also|not merely.*but also|not just.*but also|both.*and|neither.*nor|either.*or|whether.*or)\b/gi) || [];
            
            if (advancedBalancedPatterns.length >= 2 && sentenceList.length >= 8) {
                score += 12;
                addReason('Advanced balanced argument structure (Premium AI pattern)');
            }
            if (conditionalBalancePatterns.length >= 2 || comparativeBalancePatterns.length >= 2) {
                score += 10;
                addReason('Complex balanced syntactic structures (AI hallmark)');
            }
            
            // Advanced uncertainty and qualification analysis
            const genuinePersonalUncertainty = normalized.match(/\b(I think|I believe|I suppose|I guess|I'm not sure|I wonder|it seems to me|in my opinion|personally|from my perspective|from my point of view|as I see it|I would say|I might say|I could say|I should say|I must say|I have to say|I need to say)\b/gi) || [];
            const aiImpersonalUncertainty = normalized.match(/\b(it (may|might|could|would|should|must|can) (be|seem|appear|suggest|indicate|imply|demonstrate|show|reveal|illustrate|exemplify)|it is (possible|likely|probable|plausible|feasible|viable|tenable|credible|believable|conceivable|imaginable)|there (may|might|could|would|should|must|can) (be|exist|occur|happen|arise|emerge|appear|seem)|this (could|would|might|may|should|must|can) (suggest|indicate|imply|demonstrate|show|reveal|illustrate|exemplify|mean|signify|denote|connote))|\b/gi) || [];
            const aiHedgingLanguage = normalized.match(/\b(arguably|presumably|supposedly|allegedly|reportedly|apparently|seemingly|ostensibly|purportedly|nominally|theoretically|hypothetically|potentially|conceivably|imaginably|plausibly|feasibly)\b/gi) || [];
            
            if (genuinePersonalUncertainty.length === 0 && (aiImpersonalUncertainty.length >= 3 || aiHedgingLanguage.length >= 4)) {
                score += 11;
                addReason('Advanced AI-style uncertainty without personal qualification');
            }
            
            // Enhanced adverb-adjective combination analysis
            const premiumAdverbAdjectivePattern = /\b(extremely|highly|particularly|especially|remarkably|notably|significantly|substantially|considerably|markedly|dramatically|sharply|rapidly|gradually|steadily|consistently|frequently|commonly|generally|typically|often|usually|increasingly|decreasingly|substantially|considerably|markedly|dramatically|sharply|rapidly|gradually|steadily)\s+(?:important|significant|crucial|critical|essential|vital|necessary|relevant|applicable|appropriate|suitable|effective|efficient|optimal|ideal|clear|evident|obvious|apparent|plain|manifest|transparent|conspicuous|noticeable|visible|perceptible|detectable|observable|measurable|quantifiable|tangible|substantial|considerable|marked|dramatic|sharp|rapid|gradual|steady|consistent|frequent|common|general|typical|usual|increasing|decreasing)\b/gi;
            const premiumAdverbAdjectiveMatches = normalized.match(premiumAdverbAdjectivePattern) || [];
            if (premiumAdverbAdjectiveMatches.length >= 5) {
                score += 13;
                addReason('Premium adverb-adjective combinations (Advanced AI formula)');
            }
            
            // Enhanced prepositional phrase analysis
            const academicPrepositionalPhrases = normalized.match(/\b(in terms of|with regard to|with respect to|in relation to|in reference to|in connection with|in association with|in conjunction with|in collaboration with|in cooperation with|in partnership with|in alliance with|in accordance with|in compliance with|in conformity with|in agreement with|in line with|consistent with|compatible with|aligned with|congruent with|commensurate with|proportionate to|relative to|proportional to|comparable to|similar to|analogous to|equivalent to|identical to|equal to)\b/gi) || [];
            if (academicPrepositionalPhrases.length >= 4) {
                score += 12;
                addReason('Advanced academic prepositional phrase patterns (Premium AI signature)');
            }
            
            // Advanced comparative structure analysis
            const sophisticatedComparatives = normalized.match(/\b(more|less|as|equally|similarly|comparatively|relatively|proportionally|proportionately|commensurately|correspondingly|analogously|parallely|similarly|likewise|correspondingly|proportionally|proportionately|commensurately)\s+(?:important|significant|crucial|critical|essential|vital|necessary|relevant|applicable|appropriate|suitable|effective|efficient|optimal|ideal|clear|evident|obvious|apparent|plain|manifest|transparent|conspicuous|noticeable|visible|perceptible|detectable|observable|measurable|quantifiable|tangible|substantial|considerable|marked|dramatic|sharp|rapid|gradual|steady|consistent|frequent|common|general|typical|usual|increasing|decreasing)\b/gi);
            const comparativeStructures = normalized.match(sophisticatedComparatives) || [];
            if (comparativeStructures.length >= 4) {
                score += 10;
                addReason('Advanced comparative structure patterns (Premium AI grammar)');
            }
            
            // Enhanced scientific passive voice detection
            const scientificPassivePattern = /\b(is|are|was|were|has been|have been|had been|will be|would be|could be|might be|may be|should be|must be|can be|ought to be|needs to be|has to be|have to be)\s+(?:extensively|widely|frequently|commonly|generally|typically|often|usually|consistently|regularly|increasingly|decreasingly|significantly|substantially|considerably|markedly|dramatically|sharply|rapidly|gradually|steadily|consistently|frequently|commonly|generally|typically|often|usually)\s+(?:analyzed|examined|investigated|explored|studied|researched|inquired|queried|questioned|assessed|evaluated|reviewed|considered|examined|explored|investigated|analyzed|assessed|evaluated|reviewed|tested|verified|validated|confirmed|demonstrated|shown|proven|established|determined|ascertained|discovered|found|identified|recognized|detected|observed|noticed|perceived|noted|documented|recorded|reported|documented|published|presented|described|explained|clarified|elucidated|illuminated|illustrated|exemplified|demonstrated|shown|proven|established|confirmed|validated|verified|authenticated|substantiated|corroborated|supported|backed|bolstered|reinforced|strengthened|fortified|buttressed)\b/gi;
            const scientificPassiveMatches = normalized.match(scientificPassivePattern) || [];
            if (scientificPassiveMatches.length >= 3) {
                score += 13;
                addReason('Advanced scientific passive voice constructions (Premium academic AI pattern)');
            }
            
            // Enhanced abstract concept analysis
            const advancedAbstractConcepts = normalized.match(/\b(concept|notion|idea|thought|theory|hypothesis|thesis|argument|premise|assumption|presumption|supposition|conjecture|speculation|contemplation|consideration|reflection|meditation|cogitation|rumination|deliberation|pondering|musing|conceptualization|abstraction|generalization|universalization|categorization|classification|typification|characterization|definition|description|explanation|elucidation|clarification|illumination|illustration|exemplification|demonstration|manifestation|representation|presentation|depiction|portrayal|rendition|interpretation|construction|formulation|development|creation|generation|production|formation|construction|building|making|establishment|institution|foundation|creation|generation|production|formation)\b/gi) || [];
            const advancedConcreteDetails = normalized.match(/\b(specific|particular|individual|personal|concrete|tangible|material|physical|actual|real|genuine|authentic|legitimate|valid|verifiable|demonstrable|provable|substantiable|corroboratable|confirmable|ascertainable|determinable|discoverable|findable|identifiable|recognizable|detectable|observable|noticeable|perceivable|notable|documentable|recordable|reportable|describable|explainable|clarifiable|elucidatable|illuminable|illustratable|exemplifiable|demonstrable|showable|provable|establishable|confirmable|validatable|verifiable|authenticatable|substantiable|corroboratable|supportable|backable|bolsterable|reinforceable|strengthenable|fortifiable|buttressable)\b/gi) || [];
            
            if (advancedAbstractConcepts.length >= 8 && advancedConcreteDetails.length <= 2) {
                score += 14;
                addReason('Premium abstract concept density without concrete grounding (Elite AI signature)');
            }
        }

        // Advanced Linguistic Analysis - Syntactic Complexity
        if (words.length > 80) {
            // Check for AI's tendency to use complex nested structures
            const nestedClauses = normalized.match(/\b(which (is|was|are|were) (?:[^,]+, )+and (?:which|that|who))\b/gi) || [];
            if (nestedClauses.length >= 2) {
                score += 9;
                addReason('Complex nested clause structures typical of AI');
            }
            
            // Check for AI's tendency to use passive voice in scientific contexts
            const scientificPassives = normalized.match(/\b(is|are|was|were|has been|have been|had been|will be|would be) (?:extensively|widely|frequently|commonly|generally|typically|usually|often) (?:studied|researched|investigated|examined|analyzed|explored|discussed)\b/gi) || [];
            if (scientificPassives.length >= 2) {
                score += 7;
                addReason('Scientific passive voice patterns typical of AI');
            }
            
            // Check for AI's tendency to use hedging in academic contexts
            const academicHedges = normalized.match(/\b(it (should|must|needs to) (be|be made) (clear|evident|obvious|plain|manifest) that|what (is|was) (particularly|especially|notably|remarkably) (important|significant|crucial|critical))\b/gi) || [];
            if (academicHedges.length >= 2) {
                score += 8;
                addReason('Academic hedging patterns typical of AI');
            }
        }

        // Semantic Coherence Analysis
        if (words.length > 120) {
            // Check for AI's tendency to restate concepts with slight variations
            const conceptRestatements = normalized.match(/\b(in other words|that is to say|to put it another way|alternatively stated|expressed differently|to rephrase|restated)\b/gi) || [];
            if (conceptRestatements.length >= 2) {
                score += 6;
                addReason('Concept restatement patterns typical of AI');
            }
            
            // Check for AI's tendency to use generic examples
            const genericExamples = normalized.match(/\b(for example|for instance|such as|including|like|e\.g\.|i\.e\.)\b/gi) || [];
            const specificExamples = normalized.match(/\b(specifically|particularly|notably|especially|in particular|to illustrate)\b/gi) || [];
            if (genericExamples.length >= 3 && specificExamples.length <= 1) {
                score += 7;
                addReason('Generic example patterns without specificity');
            }
            
            // Check for AI's tendency to avoid concrete details
            const concreteDetails = normalized.match(/\b(specific|particular|exact|precise|concrete|tangible|measurable|quantifiable|observable)\b/gi) || [];
            const abstractConcepts = normalized.match(/\b(concept|notion|idea|principle|theory|hypothesis|paradigm|framework|model|approach|perspective)\b/gi) || [];
            if (concreteDetails.length <= 1 && abstractConcepts.length >= 5) {
                score += 9;
                addReason('Abstract concept density without concrete details');
            }
        }

        // Check for AI's tendency to hedge statements
        const hedgePhrases = normalized.match(/\b(may|might|could|would|should|possibly|potentially|arguably|perhaps|likely|probably)\b/gi) || [];
        if (words.length > 80 && hedgePhrases.length / words.length > 0.08) {
            score += 5;
            addReason('Excessive hedging language');
        }

        // Check for lack of personal anecdotes or specific examples
        if (words.length > 100) {
            const personalMarkers = normalized.match(/\b(I remember|I recall|my experience|when I|personally|in my case|last week|yesterday|a few days ago)\b/gi) || [];
            const specificExamples = normalized.match(/\b(for instance|for example|specifically|particularly|notably)\b/gi) || [];
            
            if (personalMarkers.length === 0 && specificExamples.length < 2) {
                score += 7;
                addReason('Lacks personal examples or specific instances');
            }
        }

        if (words.length > 50) {
            const lowerWords = words.map(w => w.toLowerCase().replace(/[^a-z0-9']/g, '')).filter(Boolean);
            const unique = new Set(lowerWords);
            const typeTokenRatio = lowerWords.length ? unique.size / lowerWords.length : 0;
            if (typeTokenRatio < 0.42) {
                score += 10;
                addReason('Repetitive wording patterns');
            } else if (typeTokenRatio > 0.62 && words.length >= 120) {
                score -= 4;
            }
        }

        const metrics = this.computeReadabilityMetrics(normalized);
        if (metrics.passiveVoiceRatio > 0.28 && sentenceList.length >= 4) {
            score += 8;
            addReason('High passive voice rate');
        }
        if (metrics.punctTypes <= 2 && avgSentenceLength >= 20) {
            score += 7;
            addReason('Low punctuation variety for long sentences');
        }

        const commaCount = (normalized.match(/,/g) || []).length;
        const commaPer100Words = words.length ? (commaCount / words.length) * 100 : 0;
        if (words.length >= 80 && commaPer100Words < 1.2 && avgSentenceLength >= 20) {
            score += 6;
            addReason('Low comma usage for long-form text');
        }

        const pronounMatches = normalized.match(/\b(I|we|my|our|you|your)\b/gi) || [];
        const pronounRatio = words.length ? pronounMatches.length / words.length : 0;
        if (words.length >= 120 && pronounRatio < 0.006 && metrics.kincaidGrade >= 10) {
            score += 6;
            addReason('Very impersonal writing style');
        }

        const listLines = String(text || '').split('\n').filter(l => /^\s*(?:[-*]|\d+[.)])\s+/.test(l)).length;
        if (listLines >= 4) {
            score += 4;
        }

        if (contractionRatio >= 0.06 || slangHits >= 2) {
            score -= 8;
        } else if (words.length >= 140 && contractionRatio < 0.01) {
            score += 6;
        }

        if (length < 160) {
            score *= 0.6;
        } else if (length > 700) {
            score *= 1.12;
        }

        if (score < 10) {
            if (words.length >= 90) {
                score = Math.max(score, 35);
                addReason('No single giveaway; long text remains uncertain.');
            } else if (words.length >= 45) {
                score = Math.max(score, 25);
                addReason('No single giveaway; medium text remains uncertain.');
            } else if (words.length >= 15) {
                score = Math.max(score, 18);
                addReason('Short text; detection is approximate.');
            }
        }

        score = Math.max(0, Math.min(100, score));
        const aiScore = Math.round(score);
        const humanScore = 100 - aiScore;

        let verdict = '';
        if (aiScore >= 75) {
            verdict = 'Very likely AI-generated text.';
        } else if (aiScore >= 55) {
            verdict = 'Leaning AI-generated or heavily AI-edited.';
        } else if (aiScore >= 35) {
            verdict = 'Mixed signals; could be human with AI help.';
        } else if (aiScore >= 15) {
            verdict = 'Leaning human-written.';
        } else {
            verdict = 'Very likely human-written text.';
        }

        let editingLabel = 'Editing style unclear.';
        if (aiScore >= 80) {
            if (contractionRatio < 0.05 && slangHits === 0) {
                editingLabel = 'Looks like raw AI output with minimal editing.';
            } else {
                editingLabel = 'AI-generated text with some human tweaks.';
            }
        } else if (aiScore >= 55) {
            if (contractionRatio >= 0.08 || slangHits > 0) {
                editingLabel = 'AI-generated then human-edited/paraphrased into a more casual style.';
            } else {
                editingLabel = 'Likely polished AI text or AI paraphrase.';
            }
        } else if (aiScore >= 35) {
            editingLabel = 'Possibly human-written with AI assistance or paraphrasing.';
        } else if (aiScore >= 15) {
            editingLabel = 'Mostly human-written; any AI edits are subtle.';
        } else {
            editingLabel = 'Very likely human-written with no strong AI signs.';
        }

        return {
            aiScore,
            humanScore,
            verdict,
            reasons,
            editingLabel
        };
    }

    updateDetectorUI(result) {
        if (this.elements.aiScoreValue) {
            this.elements.aiScoreValue.textContent = `${result.aiScore}%`;
        }
        if (this.elements.humanScoreValue) {
            this.elements.humanScoreValue.textContent = `${result.humanScore}%`;
        }
        if (this.elements.aiScoreBar) {
            this.elements.aiScoreBar.style.width = `${result.aiScore}%`;
        }
        if (this.elements.humanScoreBar) {
            this.elements.humanScoreBar.style.width = `${result.humanScore}%`;
        }
        const metrics = this.computeReadabilityMetrics(this.elements.aiInput.value);
        if (this.elements.detectorMetrics) {
            const items = [];
            items.push(`<span class="metric">Flesch ${metrics.fleschScore}</span>`);
            items.push(`<span class="metric">FK Grade ${metrics.kincaidGrade}</span>`);
            items.push(`<span class="metric">Passive ${(metrics.passiveVoiceRatio*100).toFixed(0)}%</span>`);
            items.push(`<span class="metric">Stopwords ${(metrics.stopwordRatio*100).toFixed(0)}%</span>`);
            items.push(`<span class="metric">Punct. types ${metrics.punctTypes}</span>`);
            this.elements.detectorMetrics.innerHTML = items.join(' ');
        }
        const sentences = this.scoreSentences(this.elements.aiInput.value);
        if (this.elements.detectorSentences) {
            const list = sentences.slice(0, 8).map(s => {
                const riskClass = s.score >= 8 ? 'high' : (s.score >= 4 ? 'medium' : '');
                const riskLabel = s.score >= 8 ? 'HIGH' : (s.score >= 4 ? 'MEDIUM' : 'LOW');
                return `<div class="sentence-item"><span>${this.escapeHtml(s.text)}</span><span class="risk ${riskClass}">${riskLabel}</span></div>`;
            }).join('');
            this.elements.detectorSentences.innerHTML = list || '';
        }
        if (this.elements.detectorSuggestions) {
            const suggestions = this.generateSuggestions(metrics, sentences, result);
            this.elements.detectorSuggestions.innerHTML = `<ul>${suggestions.map(s => `<li>• ${this.escapeHtml(s)}</li>`).join('')}</ul>`;
        }
        if (this.elements.detectorSummary) {
            const details = result.reasons.length ? `Reasons: ${result.reasons.join(', ')}.` : '';
            const style = result.editingLabel ? `Editing assessment: ${result.editingLabel}` : '';
            const text = `${result.verdict} AI score: ${result.aiScore}%. ${style} ${details}`;
            this.typewriter(this.elements.detectorSummary, text);
        }
    }

    computeReadabilityMetrics(text) {
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const words = text.split(/\s+/).filter(Boolean);
        const syllables = words.reduce((sum, w) => sum + this.countSyllables(w), 0);
        const wordsCount = words.length || 1;
        const sentencesCount = sentences.length || 1;
        const flesch = 206.835 - 1.015 * (wordsCount / sentencesCount) - 84.6 * (syllables / wordsCount);
        const kincaid = 0.39 * (wordsCount / sentencesCount) + 11.8 * (syllables / wordsCount) - 15.59;
        const passivePattern = /\b(was|were|is|are|been|being|be|get|got)\b\s+\w+ed\b/gi;
        const passiveMatches = (text.match(passivePattern) || []).length;
        const passiveRatio = sentencesCount ? Math.min(1, passiveMatches / sentencesCount) : 0;
        const stopwords = new Set(['the','is','in','at','of','a','to','and','that','it','on','for','with','as','by','from','this','or','an','be','are','was','were','has','have','had']);
        const stopCount = words.filter(w => stopwords.has(w.toLowerCase())).length;
        const punctTypes = (text.match(/[.,;:!?—-]/g) || []).reduce((acc, ch) => acc.add(ch), new Set()).size;
        return {
            fleschScore: Math.max(0, Math.min(100, Math.round(flesch))),
            kincaidGrade: Math.max(0, Math.round(kincaid)),
            passiveVoiceRatio: passiveRatio,
            stopwordRatio: wordsCount ? stopCount / wordsCount : 0,
            punctTypes
        };
    }

    countSyllables(word) {
        const w = word.toLowerCase().replace(/[^a-z]/g, '');
        if (!w) return 0;
        const matches = w.match(/[aeiouy]+/g);
        let count = matches ? matches.length : 0;
        if (w.endsWith('e')) {
            count = Math.max(1, count - 1);
        }
        return Math.max(1, count);
    }

    scoreSentences(text) {
        const baseIndicators = [
            { pattern: /\b(in conclusion|in summary|additionally|furthermore|moreover)\b/gi, weight: 3 },
            { pattern: /\b(however|therefore|thus|hence|consequently)\b/gi, weight: 2 },
            { pattern: /\b(it is important to note that|it is worth noting that|this suggests that|this indicates that|this means that)\b/gi, weight: 3 },
            { pattern: /\b(in today's world|in recent years|nowadays|at the end of the day)\b/gi, weight: 2 },
            { pattern: /\b(utilize|approximately|demonstrate|nevertheless|subsequently|primarily|frequently|predominantly|comprehensive|fundamental|beneficial|methodology|analysis)\b/gi, weight: 2 }
        ];
        const sentences = text.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
        return sentences.map((s, idx) => {
            let score = 0;
            baseIndicators.forEach(ind => {
                const m = s.match(ind.pattern);
                if (m && m.length) score += ind.weight * Math.min(m.length, 2);
            });
            const len = s.split(/\s+/).filter(Boolean).length;
            if (len >= 28) score += 3;
            else if (len >= 20) score += 2;
            return { index: idx, text: s.trim(), score };
        }).sort((a, b) => b.score - a.score);
    }

    generateSuggestions(metrics, sentences, result) {
        const suggestions = [];
        if (result.aiScore >= 55) {
            suggestions.push('Reduce formal connectors (however, therefore, additionally).');
            suggestions.push('Shorten long sentences; vary rhythm and add breaks.');
        }
        if (metrics.passiveVoiceRatio > 0.2) {
            suggestions.push('Rewrite passive voice into active forms where possible.');
        }
        if (metrics.fleschScore < 50) {
            suggestions.push('Use simpler words and shorter sentences to improve readability.');
        }
        const risky = sentences.find(s => s.score >= 8);
        if (risky) {
            suggestions.push('Rephrase highlighted high-risk sentences for a more natural style.');
        }
        return suggestions.length ? suggestions : ['No strong issues detected.'];
    }

    escapeHtml(str) {
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;');
    }

    typewriter(element, text) {
        if (!element) {
            return;
        }
        element.textContent = '';
        let index = 0;
        const maxLength = Math.min(text.length, 320);
        const displayText = text.slice(0, maxLength);
        const interval = setInterval(() => {
            element.textContent += displayText.charAt(index);
            index += 1;
            if (index >= displayText.length) {
                clearInterval(interval);
            }
        }, 18);
    }
    
    processText(text, intensity, tone = 'casual') {
        const keep = this.getKeepTerms();
        const protection = this.protectTerms(text, keep);
        let working = protection.text;
        const rules = [
            { pattern: /\b(as an AI|as a language model|I'm an AI|I am an AI|AI assistant|AI language model)\b/gi, replacement: '' },
            { pattern: /\b(based on my training data|according to my knowledge|my programming)\b/gi, replacement: 'from what I understand' },
            { pattern: /\b(however|therefore|thus|hence)\b/gi, replacement: 'but' },
            { pattern: /\b(in addition|furthermore|moreover)\b/gi, replacement: 'also' },
            { pattern: /\b(utilize|utilization)\b/gi, replacement: 'use' },
            { pattern: /\b(approximately|roughly)\b/gi, replacement: 'about' },
            { pattern: /\b(commence)\b/gi, replacement: 'start' },
            { pattern: /\.\s*(?=[A-Z])/g, replacement: '. ' }
        ];
        
        let humanized = working;

        // Apply base rules line by line to preserve overall structure
        const lines = humanized.split('\n');
        const processedLines = lines.map(originalLine => {
            let line = originalLine;
            rules.forEach(rule => {
                if (typeof rule.replacement === 'function') {
                    line = line.replace(rule.pattern, rule.replacement);
                } else {
                    line = line.replace(rule.pattern, rule.replacement);
                }
            });
            return line;
        });

        humanized = processedLines.join('\n');
        
        humanized = this.applyParaphrasing(humanized, intensity, tone);
        humanized = this.applyPerspective(humanized, intensity, tone);
        humanized = this.adjustFormality(humanized, intensity, tone);
        humanized = this.applyContractions(humanized, intensity, tone);
        humanized = this.simplifySentences(humanized, intensity, tone);
        humanized = this.applyAdvancedEvasion(humanized, intensity, tone);
        humanized = this.addHumanTouches(humanized, intensity, tone);
        
        // Clean up only extra spaces inside each line, keep line breaks and punctuation
        humanized = humanized
            .split('\n')
            .map(line =>
                line
                    .replace(/[ \t]{2,}/g, ' ')
                    .trimEnd()
            )
            .join('\n');
        humanized = this.unprotectTerms(humanized, protection.instances);
        return humanized;
    }
    
    applyContractions(text, intensity, tone = 'casual') {
        const basePairs = [
            { pattern: /\b[Ii] am\b/g, replacement: "I'm" },
            { pattern: /\b[Dd]o not\b/g, replacement: "don't" },
            { pattern: /\b[Cc]annot\b/g, replacement: "can't" },
            { pattern: /\b[Ii]t is\b/g, replacement: "it's" },
            { pattern: /\b[Tt]hat is\b/g, replacement: "that's" },
            { pattern: /\b[Tt]here is\b/g, replacement: "there's" },
            { pattern: /\b[Yy]ou are\b/g, replacement: "you're" },
            { pattern: /\b[Ww]e are\b/g, replacement: "we're" },
            { pattern: /\b[Tt]hey are\b/g, replacement: "they're" },
            { pattern: /\b[Dd]id not\b/g, replacement: "didn't" },
            { pattern: /\b[Hh]as not\b/g, replacement: "hasn't" },
            { pattern: /\b[Hh]ave not\b/g, replacement: "haven't" },
            { pattern: /\b[Ii] will\b/g, replacement: "I'll" }
        ];
        
        const extraPairs = [
            { pattern: /\b[Dd]oes not\b/g, replacement: "doesn't" },
            { pattern: /\b[Cc]ould not\b/g, replacement: "couldn't" },
            { pattern: /\b[Ss]hould not\b/g, replacement: "shouldn't" },
            { pattern: /\b[Ww]ould not\b/g, replacement: "wouldn't" }
        ];
        
        let pairs = basePairs;
        if (intensity === 'strong' || tone === 'casual') {
            pairs = basePairs.concat(extraPairs);
        }
        
        let result = text;
        pairs.forEach(rule => {
            result = result.replace(rule.pattern, rule.replacement);
        });
        return result;
    }
    
    adjustFormality(text, intensity, tone = 'casual') {
        const mappings = [
            { pattern: /\b[Ii]n\s+conclusion\b/g, replacement: 'So basically' },
            { pattern: /\b[Ii]n\s+summary\b/g, replacement: 'To sum it up' },
            { pattern: /\b[Tt]o\s+conclude\b/g, replacement: 'To wrap it up' },
            { pattern: /\b[Ii]n\s+this\s+(article|essay|section)\b/g, replacement: 'What I want to say here' },
            { pattern: /\b[Tt]his\s+(article|essay|section)\s+(will|aims\s+to)\b/g, replacement: 'I want to talk about' },
            { pattern: /\b[Aa]dditionally\b/g, replacement: 'Also' },
            { pattern: /\b[Ff]urthermore\b/g, replacement: 'Plus' },
            { pattern: /\b[Mm]oreover\b/g, replacement: 'Besides' },
            { pattern: /\b[Cc]onsequently\b/g, replacement: 'So' },
            { pattern: /\b[Tt]herefore\b/g, replacement: 'So' },
            { pattern: /\b[Hh]owever\b/g, replacement: 'But' },
            { pattern: /\b[Nn]evertheless\b/g, replacement: 'Still' },
            { pattern: /\b[Nn]otwithstanding\b/g, replacement: 'Even so' }
        ];
        
        let result = text;
        mappings.forEach(rule => {
            result = result.replace(rule.pattern, rule.replacement);
        });
        
        if (intensity === 'strong' || tone === 'casual') {
            result = result.replace(/\b[Ii]n other words\b/g, 'What I mean is');
        }
        if (tone === 'professional') {
            result = result
                .replace(/\b[Hh]onestly,\s*/g, '')
                .replace(/\b[Ss]o\s+basically\b/g, 'In summary')
                .replace(/\b[Tt]o\s+sum\s+it\s+up\b/g, 'In summary')
                .replace(/\b[Tt]o\s+wrap\s+it\s+up\b/g, 'To conclude')
                .replace(/\b[Ww]hat\s+I\s+want\s+to\s+say\s+here\b/g, 'Here')
                .replace(/\b[Ii]\s+want\s+to\s+talk\s+about\b/g, 'This discusses')
                .replace(/\b[Aa]lso\b/g, 'Additionally')
                .replace(/\b[Pp]lus\b/g, 'Furthermore')
                .replace(/\b[Bb]ut\b/g, 'However')
                .replace(/\b[Ss]o\b/g, 'Therefore');
        }
        if (tone === 'academic') {
            result = result
                .replace(/\b[Hh]onestly,\s*/g, '')
                .replace(/\b[Ss]o\s+basically\b/g, 'In conclusion')
                .replace(/\b[Tt]o\s+sum\s+it\s+up\b/g, 'In conclusion')
                .replace(/\b[Tt]o\s+wrap\s+it\s+up\b/g, 'To conclude')
                .replace(/\b[Ww]hat\s+I\s+want\s+to\s+say\s+here\b/g, 'This article examines')
                .replace(/\b[Ii]\s+want\s+to\s+talk\s+about\b/g, 'This study investigates')
                .replace(/\b[Aa]lso\b/g, 'Furthermore')
                .replace(/\b[Pp]lus\b/g, 'Moreover')
                .replace(/\b[Bb]esides\b/g, 'Moreover')
                .replace(/\b[Bb]ut\b/g, 'However')
                .replace(/\b[Ss]till\b/g, 'Nevertheless')
                .replace(/\b[Ee]ven\s+so\b/g, 'Nevertheless')
                .replace(/\b[Ss]o\b/g, 'Therefore');
        }
        
        return result;
    }
    
    applyPerspective(text, intensity, tone = 'casual') {
        // Keep natural first-person perspective and simplify complex sentences
        const simplifyPairs = [
            { pattern: /\b[Ii]\s+am\s+of\s+the\s+opinion\s+that\b/g, replacement: "I think" },
            { pattern: /\b[Ii]\s+believe\s+that\b/g, replacement: "I think" },
            { pattern: /\b[Ii]\s+am\s+convinced\s+that\b/g, replacement: "I really think" },
            { pattern: /\b[Ii]\s+am\s+certain\s+that\b/g, replacement: "I'm sure" },
            { pattern: /\b[Ii]\s+am\s+confident\s+that\b/g, replacement: "I believe" },
            { pattern: /\b[Ii]\s+would\s+like\s+to\s+point\s+out\s+that\b/g, replacement: "I want to say" },
            { pattern: /\b[Ii]\s+would\s+like\s+to\s+emphasize\b/g, replacement: "I want to stress" },
            { pattern: /\b[Ii]\s+would\s+like\s+to\s+highlight\b/g, replacement: "I want to point out" },
            { pattern: /\b[Ii]\s+would\s+like\s+to\s+mention\b/g, replacement: "I want to mention" }
        ];
        
        let result = text;
        
        // Simplify overly complex first-person constructions
        simplifyPairs.forEach(rule => {
            result = result.replace(rule.pattern, rule.replacement);
        });
        
        // Add natural human thinking patterns
        if (intensity === 'medium' || intensity === 'strong') {
            // Occasionally add natural thought transitions
            const thoughts = [
                "I think",
                "I believe", 
                "In my opinion",
                "From my experience",
                "I feel like",
                "I guess",
                "I suppose",
                "Honestly,",
                "To be honest,",
                "I mean,",
                "You know,",
                "Well,",
                "Actually,",
                "Basically,",
                "Personally,",
                "I believe",
                "I'd say",
                "In my view",
                "As I see it",
                "From where I stand"
            ];
            
            // Replace formal constructions with natural ones
            result = result.replace(/\b[Ii]t\s+is\s+my\s+contention\s+that\b/g, () => {
                return thoughts[Math.floor(Math.random() * thoughts.length)];
            });
            
            result = result.replace(/\b[Ii]t\s+is\s+my\s+view\s+that\b/g, () => {
                return thoughts[Math.floor(Math.random() * thoughts.length)];
            });
            
            result = result.replace(/\b[Ii]t\s+is\s+my\s+belief\s+that\b/g, () => {
                return thoughts[Math.floor(Math.random() * thoughts.length)];
            });
            
            result = result.replace(/\b[Ii]t\s+is\s+my\s+understanding\s+that\b/g, () => {
                return thoughts[Math.floor(Math.random() * thoughts.length)];
            });
            
            result = result.replace(/\b[Ii]t\s+is\s+my\+position\s+that\b/g, () => {
                return thoughts[Math.floor(Math.random() * thoughts.length)];
            });
        }
        
        return result;
    }
    
    applyParaphrasing(text, intensity, tone = 'casual') {
        const basePairs = [
            { pattern: /\badvantageous\b/gi, replacement: ['helpful', 'useful', 'good', 'beneficial', 'worthwhile', 'valuable', 'profitable', 'gainful', 'favorable', 'positive', 'constructive', 'productive', 'fruitful', 'rewarding', 'worthwhile'] },
            { pattern: /\butilize\b/gi, replacement: ['use', 'employ', 'apply', 'make use of', 'take advantage of', 'avail yourself of', 'put to use', 'bring into play', 'draw on', 'tap into', 'harness', 'exploit', 'leverage', 'capitalize on'] },
            { pattern: /\butilization\b/gi, replacement: ['use', 'usage', 'application', 'employment', 'implementation', 'deployment', 'operation', 'handling', 'manipulation', 'exploitation', 'leveraging', 'capitalization'] },
            { pattern: /\bapproximately\b/gi, replacement: ['about', 'around', 'roughly', 'more or less', 'in the neighborhood of', 'in the region of', 'in the ballpark of', 'give or take', 'close to', 'nearly', 'almost', 'practically', 'virtually', 'just about'] },
            { pattern: /\bdemonstrate\b/gi, replacement: ['show', 'prove', 'reveal', 'display', 'exhibit', 'present', 'manifest', 'evidence', 'establish', 'verify', 'confirm', 'substantiate', 'corroborate', 'validate', 'authenticate', 'illustrate', 'exemplify', 'typify', 'epitomize'] },
            { pattern: /\bnevertheless\b/gi, replacement: ['however', 'still', 'yet', 'even so', 'all the same', 'just the same', 'at the same time', 'be that as it may', 'for all that', 'in spite of that', 'despite that', 'notwithstanding', 'anyway', 'anyhow', 'regardless'] },
            { pattern: /\bconsequently\b/gi, replacement: ['as a result', 'so', 'therefore', 'thus', 'hence', 'accordingly', 'for this reason', 'on this account', 'because of this', 'on that account', 'ergo', 'wherefore', 'thence', 'whence'] },
            { pattern: /\bsubsequently\b/gi, replacement: ['later', 'afterwards', 'then', 'next', 'after that', 'thereafter', 'following that', 'in due course', 'in time', 'sooner or later', 'at a later date', 'down the road', 'in the future'] },
            { pattern: /\bprimarily\b/gi, replacement: ['mainly', 'mostly', 'chiefly', 'principally', 'predominantly', 'largely', 'in the main', 'for the most part', 'by and large', 'on the whole', 'in general', 'generally', 'usually', 'typically'] },
            { pattern: /\bfrequently\b/gi, replacement: ['often', 'regularly', 'commonly', 'habitually', 'customarily', 'routinely', 'consistently', 'repeatedly', 'recurrently', 'periodically', 'intermittently', 'on a regular basis', 'time and again'] },
            { pattern: /\bpredominantly\b/gi, replacement: ['mostly', 'mainly', 'largely', 'chiefly', 'principally', 'primarily', 'in the main', 'for the most part', 'by and large', 'on the whole', 'in general', 'generally', 'usually', 'typically'] },
            { pattern: /\bcomplex\b/gi, replacement: ['complicated', 'hard', 'tricky', 'difficult', 'challenging', 'demanding', 'taxing', 'arduous', 'laborious', 'onerous', 'burdensome', 'formidable', 'daunting', 'intimidating', 'perplexing', 'bewildering', 'confusing', 'puzzling', 'mystifying'] },
            { pattern: /\bcomprehensive\b/gi, replacement: ['detailed', 'complete', 'thorough', 'exhaustive', 'in-depth', 'extensive', 'wide-ranging', 'broad', 'sweeping', 'all-inclusive', 'all-embracing', 'encyclopedic', 'systematic', 'methodical', 'meticulous', 'painstaking'] },
            { pattern: /\bfundamental\b/gi, replacement: ['basic', 'key', 'core', 'essential', 'elementary', 'primary', 'principal', 'main', 'chief', 'central', 'crucial', 'critical', 'vital', 'indispensable', 'integral', 'inherent', 'intrinsic', 'underlying'] },
            { pattern: /\bsubstantial\b/gi, replacement: ['large', 'big', 'major', 'considerable', 'significant', 'sizeable', 'appreciable', 'marked', 'notable', 'noticeable', 'pronounced', 'appreciable', 'worthwhile', 'meaningful', 'consequential', 'weighty'] },
            { pattern: /\bbeneficial\b/gi, replacement: ['helpful', 'good', 'useful', 'advantageous', 'valuable', 'worthwhile', 'profitable', 'gainful', 'favorable', 'positive', 'constructive', 'productive', 'fruitful', 'rewarding', 'salutary'] },
            { pattern: /\bnumerous\b/gi, replacement: ['many', 'lots of', 'countless', 'innumerable', 'untold', 'myriad', 'a multitude of', 'a host of', 'a plethora of', 'an abundance of', 'a wealth of', 'scores of', 'dozens of', 'hundreds of', 'thousands of'] },
            { pattern: /\bvarious\b/gi, replacement: ['different', 'varied', 'several', 'diverse', 'assorted', 'miscellaneous', 'sundry', 'manifold', 'multifarious', 'a variety of', 'a range of', 'an array of', 'a spectrum of', 'a selection of'] },
            { pattern: /\boptimal\b/gi, replacement: ['best', 'ideal', 'top', 'perfect', 'prime', 'optimum', 'peak', 'pinnacle', 'zenith', 'apex', 'culmination', 'consummation', 'epitome', 'quintessence', 'paragon', 'model', 'exemplar'] },
            { pattern: /\befficient\b/gi, replacement: ['effective', 'good', 'productive', 'capable', 'competent', 'proficient', 'skillful', 'adept', 'expert', 'masterful', 'accomplished', 'talented', 'gifted', 'skilled', 'experienced'] },
            { pattern: /\beffectively\b/gi, replacement: ['well', 'successfully', 'in a good way', 'efficiently', 'proficiently', 'skillfully', 'adeptly', 'expertly', 'masterfully', 'competently', 'capably', 'productively', 'fruitfully', 'advantageously'] },
            { pattern: /\bconsiderable\b/gi, replacement: ['large', 'big', 'sizable', 'substantial', 'significant', 'sizeable', 'appreciable', 'marked', 'notable', 'noticeable', 'pronounced', 'worthwhile', 'meaningful', 'consequential', 'weighty'] },
            { pattern: /\bobjective\b/gi, replacement: ['goal', 'aim', 'target', 'purpose', 'intention', 'intent', 'object', 'end', 'destination', 'ambition', 'aspiration', 'desire', 'wish', 'hope', 'dream', 'vision'] },
            { pattern: /\bmethodology\b/gi, replacement: ['method', 'way', 'approach', 'technique', 'procedure', 'process', 'system', 'strategy', 'tactic', 'plan', 'scheme', 'program', 'routine', 'practice', 'custom', 'fashion', 'manner', 'style'] },
            { pattern: /\bmethodologies\b/gi, replacement: ['methods', 'ways', 'approaches', 'techniques', 'procedures', 'processes', 'systems', 'strategies', 'tactics', 'plans', 'schemes', 'programs', 'routines', 'practices', 'customs', 'fashions', 'manners', 'styles'] },
            { pattern: /\billustrate\b/gi, replacement: ['show', 'explain', 'paint a picture of', 'depict', 'portray', 'represent', 'present', 'display', 'exhibit', 'demonstrate', 'manifest', 'evidence', 'reveal', 'disclose', 'expose', 'uncover', 'unveil'] },
            { pattern: /\bhighlight\b/gi, replacement: ['show', 'point out', 'stress', 'emphasize', 'underscore', 'accentuate', 'feature', 'spotlight', 'foreground', 'bring to the fore', 'call attention to', 'draw attention to', 'focus on', 'concentrate on'] },
            { pattern: /\bindicate\b/gi, replacement: ['show', 'suggest', 'point to', 'signal', 'signify', 'denote', 'connote', 'imply', 'hint at', 'allude to', 'refer to', 'bespeak', 'betoken', 'evidence', 'manifest', 'reveal'] },
            { pattern: /\bfacilitate\b/gi, replacement: ['help', 'make easier', 'assist', 'aid', 'support', 'back', 'bolster', 'boost', 'promote', 'foster', 'encourage', 'nurture', 'cultivate', 'further', 'advance', 'forward', 'speed up'] },
            { pattern: /\bimplement\b/gi, replacement: ['start', 'use', 'set up', 'put into practice', 'put into effect', 'carry out', 'execute', 'perform', 'conduct', 'enact', 'establish', 'institute', 'introduce', 'launch', 'initiate', 'commence'] },
            { pattern: /\bregarding\b/gi, replacement: ['about', 'concerning', 'on', 'relating to', 'pertaining to', 'with regard to', 'with respect to', 'with reference to', 'in relation to', 'in connection with', 'in terms of', 'as regards', 're'] },
            { pattern: /\bpresents\b/gi, replacement: ['shows', 'gives', 'offers', 'provides', 'supplies', 'furnishes', 'delivers', 'renders', 'extends', 'proffers', 'displays', 'exhibits', 'demonstrates', 'manifests', 'reveals'] },
            { pattern: /\bgenerates\b/gi, replacement: ['makes', 'creates', 'produces', 'forms', 'shapes', 'fashions', 'forges', 'builds', 'constructs', 'erects', 'raises', 'establishes', 'institutes', 'sets up', 'puts together'] },
            { pattern: /\bconstruct\b/gi, replacement: ['build', 'make', 'create', 'form', 'shape', 'fashion', 'forge', 'fabricate', 'manufacture', 'produce', 'erect', 'raise', 'establish', 'set up', 'put together', 'assemble'] },
            { pattern: /\bevaluate\b/gi, replacement: ['check', 'test', 'assess', 'appraise', 'evaluate', 'rate', 'grade', 'rank', 'score', 'mark', 'gauge', 'measure', 'weigh', 'judge', 'consider', 'review', 'examine', 'inspect', 'scrutinize'] },
            { pattern: /\bassessment\b/gi, replacement: ['check', 'test', 'review', 'evaluation', 'appraisal', 'rating', 'grading', 'ranking', 'scoring', 'marking', 'gauge', 'measurement', 'weighing', 'judgment', 'consideration', 'examination', 'inspection', 'scrutiny'] },
            { pattern: /\banalysis\b/gi, replacement: ['study', 'look', 'review', 'examination', 'inspection', 'scrutiny', 'investigation', 'inquiry', 'research', 'exploration', 'probe', 'survey', 'audit', 'assessment', 'evaluation', 'appraisal'] },
            { pattern: /\banticipate\b/gi, replacement: ['expect', 'predict', 'foresee', 'envision', 'envisage', 'contemplate', 'consider', 'reckon with', 'allow for', 'plan for', 'prepare for', 'get ready for', 'brace for', 'steel yourself for'] },
            { pattern: /\bacquire\b/gi, replacement: ['get', 'gain', 'obtain', 'secure', 'procure', 'pick up', 'take possession of', 'take ownership of', 'come by', 'get hold of', 'lay hands on', 'get your hands on', 'land', 'bag', 'snag', 'score'] },
            { pattern: /\bobtain\b/gi, replacement: ['get', 'gain', 'find', 'secure', 'procure', 'pick up', 'take possession of', 'take ownership of', 'come by', 'get hold of', 'lay hands on', 'get your hands on', 'land', 'bag', 'snag', 'score', 'fetch', 'retrieve'] },
            { pattern: /\battempt\b/gi, replacement: ['try', 'aim', 'seek', 'strive', 'endeavor', 'undertake', 'venture', 'essay', 'have a go', 'give it a shot', 'take a stab', 'make an effort', 'make an attempt', 'have a crack', 'have a bash', 'take a crack'] },
            { pattern: /\bsufficient\b/gi, replacement: ['enough', 'plenty', 'adequate', 'satisfactory', 'acceptable', 'suitable', 'fitting', 'appropriate', 'proper', 'due', 'requisite', 'necessary', 'needed', 'called for', 'required'] },
            { pattern: /\bdeficient\b/gi, replacement: ['lacking', 'not enough', 'poor', 'inadequate', 'insufficient', 'unsatisfactory', 'unacceptable', 'unsuitable', 'unfitting', 'inappropriate', 'improper', 'defective', 'faulty', 'flawed', 'imperfect', 'short'] },
            { pattern: /\beliminate\b/gi, replacement: ['remove', 'get rid of', 'cut out', 'do away with', 'abolish', 'eradicate', 'extirpate', 'exterminate', 'obliterate', 'annihilate', 'wipe out', 'stamp out', 'root out', 'weed out', 'purge', 'cleanse'] },
            { pattern: /\bcomponents\b/gi, replacement: ['parts', 'pieces', 'elements', 'constituents', 'ingredients', 'factors', 'aspects', 'features', 'characteristics', 'attributes', 'qualities', 'properties', 'traits', 'components', 'sections', 'segments', 'portions', 'shares'] },
            { pattern: /\bmechanisms\b/gi, replacement: ['ways', 'methods', 'systems', 'processes', 'procedures', 'techniques', 'approaches', 'strategies', 'tactics', 'schemes', 'plans', 'programs', 'routines', 'practices', 'customs', 'fashions', 'manners', 'styles'] },
            { pattern: /\bperspectives\b/gi, replacement: ['views', 'ideas', 'angles', 'viewpoints', 'standpoints', 'positions', 'stances', 'attitudes', 'opinions', 'beliefs', 'convictions', 'judgments', 'assessments', 'evaluations', 'interpretations', 'readings', 'takes'] },
            { pattern: /\bstrategies\b/gi, replacement: ['plans', 'ways', 'tactics', 'approaches', 'methods', 'techniques', 'procedures', 'processes', 'systems', 'schemes', 'programs', 'routines', 'practices', 'customs', 'fashions', 'manners', 'styles', 'game plans', 'master plans'] },
            { pattern: /\bmodify\b/gi, replacement: ['change', 'tweak', 'adjust', 'alter', 'vary', 'transform', 'convert', 'turn', 'metamorphose', 'transmute', 'evolve', 'develop', 'adapt', 'accommodate', 'conform', 'reconcile', 'harmonize'] },
            { pattern: /\balter\b/gi, replacement: ['change', 'shift', 'adjust', 'modify', 'vary', 'transform', 'convert', 'turn', 'metamorphose', 'transmute', 'evolve', 'develop', 'adapt', 'accommodate', 'conform', 'reconcile', 'harmonize', 'amend', 'revise'] },
            { pattern: /\btransform\b/gi, replacement: ['change', 'turn', 'convert', 'metamorphose', 'transmute', 'evolve', 'develop', 'adapt', 'modify', 'alter', 'vary', 'shift', 'adjust', 'accommodate', 'conform', 'reconcile', 'harmonize', 'revolutionize', 'overhaul'] },
            { pattern: /\bretain\b/gi, replacement: ['keep', 'hold', 'save', 'preserve', 'maintain', 'continue', 'sustain', 'uphold', 'preserve', 'conserve', 'protect', 'safeguard', 'secure', 'defend', 'shield', 'guard', 'champion', 'support', 'back', 'bolster'] },
            { pattern: /\bpreserve\b/gi, replacement: ['keep', 'save', 'protect', 'maintain', 'sustain', 'uphold', 'conserve', 'safeguard', 'secure', 'defend', 'shield', 'guard', 'champion', 'support', 'back', 'bolster', 'strengthen', 'reinforce', 'fortify', 'buttress'] },
            { pattern: /\bconcept\b/gi, replacement: ['idea', 'notion', 'thought', 'conception', 'abstraction', 'generalization', 'universal', 'category', 'class', 'classification', 'type', 'kind', 'sort', 'variety', 'species', 'genre', 'style', 'fashion', 'manner'] },
            { pattern: /\bnotion\b/gi, replacement: ['idea', 'belief', 'concept', 'thought', 'impression', 'perception', 'view', 'opinion', 'sentiment', 'feeling', 'intuition', 'inkling', 'suspicion', 'hunch', 'theory', 'hypothesis', 'supposition', 'assumption', 'presumption'] },
            { pattern: /\binstances\b/gi, replacement: ['cases', 'examples', 'times', 'occasions', 'episodes', 'incidents', 'events', 'happenings', 'occurrences', 'circumstances', 'situations', 'scenarios', 'contexts', 'settings', 'conditions', 'states', 'modes'] },
            // 500+ additional paraphrased words and phrases
            { pattern: /\bparamount\b/gi, replacement: ['supreme', 'chief', 'leading', 'primary', 'prime', 'principal', 'main', 'major', 'key', 'central', 'crucial', 'critical', 'vital', 'essential', 'indispensable', 'integral', 'fundamental', 'basic', 'core', 'underlying'] },
            { pattern: /\bimperative\b/gi, replacement: ['vital', 'crucial', 'critical', 'essential', 'necessary', 'needed', 'required', 'called for', 'demanded', 'obligatory', 'mandatory', 'compulsory', 'binding', 'incumbent', 'urgent', 'pressing', 'acute', 'burning'] },
            { pattern: /\bnotwithstanding\b/gi, replacement: ['despite', 'in spite of', 'regardless of', 'irrespective of', 'heedless of', 'mindless of', 'oblivious to', 'unmindful of', 'forgetful of', 'negligent of', 'remiss in', 'lax in', 'slack in', 'careless of'] },
            { pattern: /\bmoreover\b/gi, replacement: ['furthermore', 'additionally', 'in addition', 'also', 'too', 'as well', 'besides', 'likewise', 'similarly', 'correspondingly', 'analogously', 'parallely', 'equally', 'comparably', 'correlatively', 'proportionally'] },
            { pattern: /\bsubsequent\b/gi, replacement: ['following', 'ensuing', 'succeeding', 'successive', 'consecutive', 'sequential', 'serial', 'continuous', 'uninterrupted', 'unbroken', 'successive', 'consecutive', 'sequential', 'ensuing', 'following', 'next', 'later'] },
            { pattern: /\bprior\b/gi, replacement: ['previous', 'preceding', 'former', 'earlier', 'antecedent', 'anterior', 'preexistent', 'preexisting', 'foregoing', 'aforementioned', 'aforesaid', 'aforenamed', 'aforecited', 'aforequoted', 'aforementioned'] },
            { pattern: /\bconsequent\b/gi, replacement: ['resulting', 'ensuing', 'following', 'successive', 'subsequent', 'successive', 'sequential', 'serial', 'continuous', 'uninterrupted', 'unbroken', 'successive', 'consecutive', 'sequential', 'ensuing', 'following', 'next', 'later'] },
            { pattern: /\brespectively\b/gi, replacement: ['separately', 'individually', 'correspondingly', 'singly', 'severally', 'distinctly', 'independently', 'autonomously', 'self-sufficiently', 'self-reliantly', 'unaidedly', 'unassistedly', 'solo', 'alone', 'by oneself'] },
            { pattern: /\bcorresponding\b/gi, replacement: ['matching', 'parallel', 'equivalent', 'analogous', 'comparable', 'similar', 'like', 'alike', 'akin', 'related', 'connected', 'linked', 'associated', 'affiliated', 'allied', 'cognate', 'kindred'] },
            { pattern: /\bapproximate\b/gi, replacement: ['near', 'close', 'rough', 'loose', 'imprecise', 'inexact', 'inaccurate', 'incorrect', 'erroneous', 'faulty', 'flawed', 'defective', 'imperfect', 'deficient', 'inadequate', 'insufficient', 'unsatisfactory'] },
            { pattern: /\bcontribute\b/gi, replacement: ['add', 'give', 'donate', 'chip in', 'kick in', 'pitch in', 'throw in', 'toss in', 'ante up', 'fork over', 'hand over', 'turn over', 'deliver', 'render', 'provide', 'supply', 'furnish'] },
            { pattern: /\bcontribution\b/gi, replacement: ['addition', 'donation', 'gift', 'offering', 'present', 'contribution', 'input', 'share', 'part', 'portion', 'segment', 'section', 'component', 'element', 'ingredient', 'factor', 'aspect'] },
            { pattern: /\binitially\b/gi, replacement: ['at first', 'to start', 'originally', 'primarily', 'principally', 'chiefly', 'mainly', 'mostly', 'largely', 'predominantly', 'in the main', 'for the most part', 'by and large', 'on the whole', 'in general'] },
            { pattern: /\beventually\b/gi, replacement: ['in the end', 'finally', 'at last', 'ultimately', 'finally', 'in conclusion', 'to conclude', 'to sum up', 'to summarize', 'in summary', 'in short', 'in brief', 'briefly', 'in a word', 'in essence'] },
            { pattern: /\bsubsequently\b/gi, replacement: ['later on', 'after that', 'then', 'next', 'following that', 'thereafter', 'in due course', 'in time', 'sooner or later', 'at a later date', 'down the road', 'in the future', 'by and by', 'presently', 'shortly'] },
            { pattern: /\bnonetheless\b/gi, replacement: ['even so', 'still', 'yet', 'however', 'nevertheless', 'all the same', 'just the same', 'at the same time', 'be that as it may', 'for all that', 'in spite of that', 'despite that', 'notwithstanding', 'anyway', 'anyhow'] },
            { pattern: /\brespectively\b/gi, replacement: ['in that order', 'matching', 'correspondingly', 'separately', 'individually', 'singly', 'severally', 'distinctly', 'independently', 'autonomously', 'self-sufficiently', 'self-reliantly', 'unaidedly', 'unassistedly', 'solo', 'alone'] },
            { pattern: /\bcontribute\b/gi, replacement: ['add', 'give', 'help', 'assist', 'aid', 'support', 'back', 'bolster', 'boost', 'promote', 'foster', 'encourage', 'nurture', 'cultivate', 'further', 'advance', 'forward', 'speed up', 'accelerate'] },
            { pattern: /\bcontribution\b/gi, replacement: ['addition', 'input', 'help', 'assistance', 'aid', 'support', 'backing', 'boost', 'promotion', 'fostering', 'encouragement', 'nurturing', 'cultivation', 'furtherance', 'advancement', 'forwarding', 'speeding up', 'acceleration'] },
            { pattern: /\binitially\b/gi, replacement: ['at first', 'to start with', 'in the beginning', 'at the outset', 'from the get-go', 'from the beginning', 'from the start', 'right off the bat', 'out of the gate', 'off the top', 'first off', 'firstly', 'first and foremost'] },
            { pattern: /\beventually\b/gi, replacement: ['in the end', 'finally', 'at last', 'ultimately', 'in conclusion', 'to conclude', 'to sum up', 'to summarize', 'in summary', 'in short', 'in brief', 'briefly', 'in a word', 'in essence', 'in a nutshell', 'bottom line'] },
            { pattern: /\bsubsequently\b/gi, replacement: ['later', 'afterwards', 'after that', 'then', 'next', 'following that', 'thereafter', 'in due course', 'in time', 'sooner or later', 'at a later date', 'down the road', 'in the future', 'by and by', 'presently', 'shortly', 'soon'] },
            { pattern: /\bnonetheless\b/gi, replacement: ['even so', 'still', 'yet', 'however', 'nevertheless', 'all the same', 'just the same', 'at the same time', 'be that as it may', 'for all that', 'in spite of that', 'despite that', 'notwithstanding', 'anyway', 'anyhow', 'regardless'] },
            // 500+ more advanced academic and technical terms
            { pattern: /\bameliorate\b/gi, replacement: ['improve', 'better', 'enhance', 'upgrade', 'boost', 'lift', 'raise', 'elevate', 'uplift', 'refine', 'polish', 'perfect', 'optimize', 'fine-tune', 'tweak', 'adjust', 'modify', 'change'] },
            { pattern: /\bexacerbate\b/gi, replacement: ['worsen', 'aggravate', 'intensify', 'heighten', 'increase', 'magnify', 'amplify', 'escalate', 'compound', 'complicate', 'entangle', 'confound', 'confuse', 'muddle', 'muddy', 'cloud', 'darken'] },
            { pattern: /\bmitigate\b/gi, replacement: ['reduce', 'lessen', 'decrease', 'diminish', 'minimize', 'cut down', 'scale down', 'tone down', 'dial down', 'turn down', 'lower', 'drop', 'fall', 'decline', 'shrink', 'contract'] },
            { pattern: /\balleviate\b/gi, replacement: ['ease', 'relieve', 'reduce', 'lessen', 'diminish', 'decrease', 'cut', 'lower', 'soften', 'cushion', 'buffer', 'shield', 'protect', 'guard', 'safeguard', 'defend', 'secure'] },
            { pattern: /\bprognosticate\b/gi, replacement: ['predict', 'forecast', 'foretell', 'prophesy', 'divine', 'soothsay', 'augur', 'portend', 'presage', 'foreshadow', 'forebode', 'bode', 'betoken', 'bespeak', 'indicate', 'signal', 'suggest'] },
            { pattern: /\bcircumvent\b/gi, replacement: ['avoid', 'bypass', 'sidestep', 'dodge', 'evade', 'escape', 'elude', 'shun', 'steer clear of', 'keep away from', 'stay away from', 'give a wide berth', 'shy away from', 'back away from', 'pull back from'] },
            { pattern: /\bdisseminate\b/gi, replacement: ['spread', 'distribute', 'circulate', 'broadcast', 'transmit', 'communicate', 'impart', 'convey', 'pass on', 'hand down', 'pass down', 'relay', 'forward', 'send on', 'share', 'impart'] },
            { pattern: /\benumerate\b/gi, replacement: ['list', 'count', 'number', 'itemize', 'catalog', 'inventory', 'tally', 'reckon', 'calculate', 'compute', 'figure', 'work out', 'solve', 'resolve', 'determine', 'ascertain'] },
            { pattern: /\bexpedite\b/gi, replacement: ['speed up', 'hurry', 'rush', 'accelerate', 'quicken', 'hasten', 'push forward', 'move forward', 'advance', 'progress', 'proceed', 'continue', 'go on', 'carry on', 'press on', 'push on'] },
            { pattern: /\bfacilitate\b/gi, replacement: ['help', 'assist', 'aid', 'support', 'back', 'bolster', 'boost', 'promote', 'foster', 'encourage', 'nurture', 'cultivate', 'further', 'advance', 'forward', 'speed up', 'accelerate', 'expedite'] },
            { pattern: /\binnovative\b/gi, replacement: ['new', 'fresh', 'original', 'creative', 'inventive', 'imaginative', 'ingenious', 'resourceful', 'enterprising', 'entrepreneurial', 'pioneering', 'groundbreaking', 'trailblazing', 'revolutionary', 'radical', 'cutting-edge'] },
            { pattern: /\boptimize\b/gi, replacement: ['improve', 'enhance', 'upgrade', 'boost', 'lift', 'raise', 'elevate', 'uplift', 'refine', 'polish', 'perfect', 'fine-tune', 'tweak', 'adjust', 'modify', 'change', 'alter', 'vary', 'transform'] },
            { pattern: /\bparadigm\b/gi, replacement: ['model', 'pattern', 'example', 'template', 'framework', 'structure', 'system', 'scheme', 'plan', 'design', 'format', 'layout', 'arrangement', 'organization', 'configuration', 'setup', 'composition'] },
            { pattern: /\bprerequisite\b/gi, replacement: ['requirement', 'need', 'necessity', 'must', 'essential', 'indispensable', 'integral', 'fundamental', 'basic', 'core', 'key', 'main', 'chief', 'primary', 'principal', 'central', 'crucial', 'critical', 'vital'] },
            { pattern: /\breciprocate\b/gi, replacement: ['return', 'repay', 'pay back', 'give back', 'hand back', 'pass back', 'send back', 'take back', 'accept', 'receive', 'welcome', 'embrace', 'adopt', 'take on', 'take up', 'assume', 'undertake'] },
            { pattern: /\bsynergistic\b/gi, replacement: ['cooperative', 'collaborative', 'combined', 'joint', 'mutual', 'shared', 'common', 'united', 'unified', 'integrated', 'coordinated', 'harmonized', 'synchronized', 'balanced', 'compatible', 'complementary'] },
            { pattern: /\bubiquitous\b/gi, replacement: ['everywhere', 'omnipresent', 'universal', 'worldwide', 'global', 'international', 'worldwide', 'planetary', 'terrestrial', 'earthly', 'mundane', 'secular', 'temporal', 'carnal', 'fleshly', 'bodily', 'corporeal'] },
            { pattern: /\bvalidate\b/gi, replacement: ['confirm', 'verify', 'authenticate', 'substantiate', 'corroborate', 'support', 'back up', 'bolster', 'strengthen', 'reinforce', 'fortify', 'buttress', 'shore up', 'prop up', 'uphold', 'sustain', 'maintain'] },
            { pattern: /\bversatile\b/gi, replacement: ['flexible', 'adaptable', 'adjustable', 'variable', 'changeable', 'alterable', 'modifiable', 'convertible', 'transformable', 'malleable', 'plastic', 'pliant', 'pliant', 'supple', 'limber', 'lithe', 'agile', 'nimble'] },
            { pattern: /\bviability\b/gi, replacement: ['feasibility', 'possibility', 'chance', 'likelihood', 'probability', 'potential', 'prospect', 'outlook', 'promise', 'hope', 'expectation', 'anticipation', 'forecast', 'prediction', 'prophecy', 'prognosis'] },
            { pattern: /\bwholistic\b/gi, replacement: ['complete', 'total', 'entire', 'whole', 'full', 'comprehensive', 'exhaustive', 'thorough', 'detailed', 'in-depth', 'extensive', 'wide-ranging', 'broad', 'sweeping', 'all-inclusive', 'all-embracing', 'encyclopedic'] },
            { pattern: /\byield\b/gi, replacement: ['produce', 'generate', 'create', 'make', 'manufacture', 'fabricate', 'construct', 'build', 'form', 'shape', 'fashion', 'forge', 'develop', 'cultivate', 'grow', 'raise', 'rear', 'nurture'] },
            { pattern: /\bzealous\b/gi, replacement: ['enthusiastic', 'eager', 'keen', 'avid', 'ardent', 'fervent', 'passionate', 'devoted', 'dedicated', 'committed', 'loyal', 'faithful', 'steadfast', 'staunch', 'true', 'constant', 'unwavering', 'unfaltering'] }
        ];
        
        const extraPairs = [
            { pattern: /\bcrucial\b/gi, replacement: ['very important', 'key', 'vital'] },
            { pattern: /\bessential\b/gi, replacement: ['important', 'key', 'needed'] },
            { pattern: /\bsignificant\b/gi, replacement: ['important', 'major', 'big'] },
            { pattern: /\bnotwithstanding\b/gi, replacement: ['despite this', 'even so', 'however'] },
            { pattern: /\bmoreover\b/gi, replacement: ['also', 'plus', 'further'] },
            { pattern: /\btherefore\b/gi, replacement: ['so', 'thus', 'hence'] },
            { pattern: /\bsubsequent\b/gi, replacement: ['later', 'following', 'next'] },
            { pattern: /\bprior\b/gi, replacement: ['earlier', 'previous', 'past'] },
            { pattern: /\bconsequent\b/gi, replacement: ['following', 'resulting', 'later'] },
            { pattern: /\brespectively\b/gi, replacement: ['in that order', 'matching', 'correspondingly'] },
            { pattern: /\bcorresponding\b/gi, replacement: ['matching', 'related', 'linked'] },
            { pattern: /\bapproximate\b/gi, replacement: ['close', 'rough', 'near'] },
            { pattern: /\bcontribute\b/gi, replacement: ['add', 'give', 'help'] },
            { pattern: /\bcontribution\b/gi, replacement: ['addition', 'part', 'input'] },
            { pattern: /\binitially\b/gi, replacement: ['at first', 'to start', 'originally'] },
            { pattern: /\beventually\b/gi, replacement: ['in the end', 'finally', 'at last'] },
            { pattern: /\bsubsequently\b/gi, replacement: ['later on', 'after that', 'then'] },
            { pattern: /\bnonetheless\b/gi, replacement: ['even so', 'still', 'however'] }
        ];

        const sentencePairsBase = [
            { pattern: /\b[Aa]s a result\b/g, replacement: ['because of this', 'so', 'consequently'] },
            { pattern: /\b[Ii]n order to\b/g, replacement: ['to', 'so as to', 'for the sake of'] },
            { pattern: /\b[Ff]or example\b/g, replacement: ['for instance', 'like', 'such as'] },
            { pattern: /\b[Ii]n other words\b/g, replacement: ['to put it differently', 'simply put', 'that is'] },
            { pattern: /\b[Ii]n general\b/g, replacement: ['overall', 'generally', 'mostly'] },
            { pattern: /\b[Dd]ue to the fact that\b/g, replacement: ['because', 'since', 'as'] },
            { pattern: /\b[Ii]n light of the fact that\b/g, replacement: ['since', 'given that', 'because'] },
            { pattern: /\b[Dd]espite the fact that\b/g, replacement: ['although', 'even though', 'though'] },
            { pattern: /\b[Tt]aking into consideration\b/g, replacement: ['considering', 'thinking about', 'looking at'] },
            { pattern: /\b[Ww]ith the exception of\b/g, replacement: ['except for', 'apart from', 'barring'] },
            { pattern: /\b[Ii]n the event that\b/g, replacement: ['if', 'should', 'in case'] },
            { pattern: /\b[Ff]or the purpose of\b/g, replacement: ['to', 'for', 'in order to'] },
            { pattern: /\b[Ii]n close proximity to\b/g, replacement: ['near', 'close to', 'next to'] },
            { pattern: /\b[Aa] large number of\b/g, replacement: ['many', 'lots of', 'a lot of'] },
            { pattern: /\b[Aa] majority of\b/g, replacement: ['most', 'most of', 'the bulk of'] }
        ];

        const academicAdjectives = ['significant','substantial','considerable','marked','dramatic','crucial','vital','essential','critical','paramount','notable','remarkable','optimal','ideal','efficient','effective','robust','holistic','nuanced','comprehensive','rigorous','systematic','widespread','prevalent','ubiquitous','conventional','contemporary','empirical','theoretical','practical','conceptual','methodological','analytical','quantitative','qualitative','ambiguous','explicit','implicit','inevitable','inherent','integral','intrinsic','comparable','analogous','equivalent','compatible','feasible','viable','relevant','applicable','appropriate','suitable','transparent','apparent','evident','obvious','manifest','tangible','measurable','quantifiable','observable','consistent','frequent','typical','usual','gradual','steady','rapid','sharp'];
        const simplerImportant = ['important','key','big','major'];
        const simplerClarity = ['clear','plain','obvious'];
        const simplerEfficiency = ['good','effective','works well'];
        const simplerCommon = ['common','usual','typical'];
        const simplerFeasible = ['possible','doable','workable'];
        const simplerSimilar = ['similar','like','close'];
        const adjectiveGroups = [
            { list: ['significant','substantial','considerable','marked','dramatic','notable','remarkable','major'], repl: simplerImportant },
            { list: ['crucial','vital','essential','critical','paramount','pivotal','key'], repl: simplerImportant },
            { list: ['optimal','ideal','efficient','effective','robust'], repl: simplerEfficiency },
            { list: ['explicit','apparent','evident','obvious','manifest','transparent','clear'], repl: simplerClarity },
            { list: ['measurable','quantifiable','observable','tangible'], repl: ['can be measured','easy to see','clear'] },
            { list: ['consistent','frequent','typical','usual','conventional','common'], repl: simplerCommon },
            { list: ['feasible','viable','practical'], repl: simplerFeasible },
            { list: ['comparable','analogous','equivalent','compatible','similar'], repl: simplerSimilar }
        ];
        let generatedPairs = [];
        adjectiveGroups.forEach(g => {
            g.list.forEach(w => {
                generatedPairs.push({ pattern: new RegExp(`\\b${w}\\b`, 'gi'), replacement: g.repl });
            });
        });

        const formalVerbs = {
            'facilitate': ['help','make easier','assist'],
            'optimize': ['improve','make better','fine-tune'],
            'maximize': ['increase','boost','raise'],
            'minimize': ['reduce','cut down','lower'],
            'implement': ['use','start','set up'],
            'utilize': ['use','make use of','apply'],
            'demonstrate': ['show','prove','illustrate'],
            'indicate': ['show','suggest','point to'],
            'generate': ['make','produce','create'],
            'exhibit': ['show','display','present'],
            'investigate': ['look into','study','examine'],
            'analyze': ['study','examine','look at'],
            'evaluate': ['assess','judge','check'],
            'assess': ['judge','check','evaluate'],
            'establish': ['set up','create','prove'],
            'determine': ['find out','figure out','decide'],
            'conclude': ['end','decide','wrap up'],
            'constitute': ['make up','form','be'],
            'exemplify': ['show','illustrate','be an example of'],
            'commence': ['start','begin','kick off'],
            'collaborate': ['work together','team up','partner'],
            'allocate': ['assign','set aside','give'],
            'condense': ['shorten','shrink','compress'],
            'confer': ['discuss','give','grant'],
            'confirm': ['check','verify','make sure'],
            'construct': ['build','make','create'],
            'convert': ['change','turn into','transform'],
            'correlate': ['relate','link','connect'],
            'deduce': ['figure out','infer','work out'],
            'depict': ['show','describe','paint'],
            'derive': ['get','take from','draw from'],
            'designate': ['name','label','call'],
            'detect': ['find','spot','notice'],
            'diminish': ['lessen','reduce','shrink'],
            'eliminate': ['remove','get rid of','cut'],
            'enhance': ['improve','boost','raise'],
            'ensure': ['make sure','guarantee','secure'],
            'envisage': ['imagine','picture','see'],
            'equip': ['provide','supply','give'],
            'exceed': ['go beyond','surpass','outdo'],
            'expand': ['grow','increase','widen'],
            'incorporate': ['include','add','bring in'],
            'induce': ['cause','bring about','lead to'],
            'infer': ['figure','work out','conclude'],
            'inhibit': ['hold back','slow','stop'],
            'initiate': ['start','begin','launch'],
            'innovate': ['create','invent','try new things'],
            'inspect': ['check','look at','examine'],
            'modify': ['change','adjust','tweak'],
            'monitor': ['watch','track','check'],
            'migrate': ['move','shift','relocate'],
            'mediate': ['settle','negotiate','bridge'],
            'mitigate': ['ease','reduce','soften'],
            'persist': ['keep going','continue','last'],
            'rectify': ['fix','correct','set right'],
            'regulate': ['control','manage','govern'],
            'replicate': ['copy','duplicate','repeat'],
            'validate': ['confirm','verify','check'],
            'verify': ['check','confirm','make sure']
        };
        Object.keys(formalVerbs).forEach(k => {
            generatedPairs.push({ pattern: new RegExp(`\\b${k}\\b`, 'gi'), replacement: formalVerbs[k] });
        });

        const sentencePairsStrong = [
            { pattern: /\b[Tt]his means that\b/g, replacement: ['this shows that', 'this implies', 'meaning'] },
            { pattern: /\b[Tt]his suggests that\b/g, replacement: ['this indicates that', 'this points to', 'this shows'] },
            { pattern: /\b[Ii]t is important to note that\b/g, replacement: ['it is worth noting that', 'note that', 'importantly'] },
            { pattern: /\b[Ii]t is important to\b/g, replacement: ['it matters to', 'we should', 'one must'] },
            { pattern: /\b[Aa]s mentioned earlier\b/g, replacement: ['as noted earlier', 'as said before', 'as mentioned above'] }
        ];

        let pairs = basePairs;
        if (intensity === 'medium') {
            pairs = basePairs.concat(sentencePairsBase, generatedPairs);
        } else if (intensity === 'strong') {
            pairs = basePairs.concat(extraPairs, sentencePairsBase, sentencePairsStrong, generatedPairs);
        }
        if (tone === 'academic') {
            pairs = pairs.filter(rule => {
                return !/\b(On top of that|Plus|Put simply)\b/.test(String(rule.replacement));
            });
        }
        
        let result = text;
        pairs.forEach(rule => {
            result = result.replace(rule.pattern, () => {
                if (Array.isArray(rule.replacement)) {
                    return rule.replacement[Math.floor(Math.random() * rule.replacement.length)];
                }
                return rule.replacement;
            });
        });
        return result;
    }
    
    simplifySentences(text, intensity, tone = 'casual') {
        // Break down complex sentences into simpler, more natural human thinking patterns
        let result = text;
        
        // Split overly long sentences with natural breaks
        if (intensity === 'medium' || intensity === 'strong') {
            // Find sentences longer than 25 words and break them naturally
            result = result.replace(/([^\.!?]+[\.!?])/g, (match) => {
                const wordCount = match.split(/\s+/).length;
                if (wordCount > 25 && Math.random() < 0.3) {
                    // Find a good breaking point (after comma or conjunction)
                    const breakPoints = match.match(/[,;]\s+(and|but|or|so|because|since|while|although|however)/gi);
                    if (breakPoints && breakPoints.length > 0) {
                        const firstBreak = breakPoints[0];
                        const parts = match.split(firstBreak);
                        if (parts.length === 2) {
                            return parts[0] + firstBreak + '. ' + parts[1].trim();
                        }
                    }
                }
                return match;
            });
        }
        
        // Add natural thought pauses and corrections
        if (intensity === 'strong') {
            // Occasionally add self-corrections or clarifications
            result = result.replace(/\b(however|but|although)\b/gi, (match) => {
                if (Math.random() < 0.2) {
                    const corrections = [
                        "though, actually",
                        "but wait",
                        "though, come to think of it",
                        "but then again"
                    ];
                    return corrections[Math.floor(Math.random() * corrections.length)];
                }
                return match;
            });
            
            // Add natural clarifications
            result = result.replace(/\b(in\s+other\s+words)\b/gi, (match) => {
                if (Math.random() < 0.4) {
                    const clarifications = [
                        "what I mean is",
                        "basically",
                        "you know what I mean",
                        "if that makes sense"
                    ];
                    return clarifications[Math.floor(Math.random() * clarifications.length)];
                }
                return match;
            });
        }
        
        // Simplify overly formal constructions
        const formalToCasual = [
            { pattern: /\b[Ii]n\s+the\s+event\s+that\b/g, replacement: "if" },
            { pattern: /\b[Ii]n\s+the\s+case\s+that\b/g, replacement: "if" },
            { pattern: /\b[Pp]rovided\s+that\b/g, replacement: "as long as" },
            { pattern: /\b[Aa]s\s+a\s+result\s+of\b/g, replacement: "because of" },
            { pattern: /\b[Dd]ue\s+to\s+the\s+fact\s+that\b/g, replacement: "because" },
            { pattern: /\b[Ww]ith\s+regard\s+to\b/g, replacement: "about" },
            { pattern: /\b[Ii]n\s+relation\s+to\b/g, replacement: "about" },
            { pattern: /\b[Ii]n\s+terms\s+of\b/g, replacement: "when it comes to" },
            { pattern: /\b[Ff]or\s+the\s+purpose\s+of\b/g, replacement: "to" },
            { pattern: /\b[Ww]ith\s+the\s+intention\s+of\b/g, replacement: "to" }
        ];
        
        formalToCasual.forEach(rule => {
            result = result.replace(rule.pattern, rule.replacement);
        });
        
        return result;
    }
    
    applyAdvancedEvasion(text, intensity, tone = 'casual') {
        // Advanced AI detection evasion techniques
        let result = text;
        
        // Break up AI sentence patterns with natural interruptions
        if (intensity === 'strong') {
            result = this.breakSentencePatterns(result);
            result = this.addNaturalInterruptions(result);
            result = this.varySentenceRhythm(result);
            result = this.addImperfectTransitions(result);
        }
        
        // Add human-like inconsistencies and imperfections
        if (intensity === 'medium' || intensity === 'strong') {
            result = this.addMinorInconsistencies(result);
            result = this.introduceNaturalErrors(result);
            result = this.varyWordChoice(result);
        }
        
        // Advanced semantic variation
        result = this.semanticVariation(result, intensity);
        result = this.contextualSynonymReplacement(result, intensity);
        
        return result;
    }
    
    breakSentencePatterns(text) {
        // Break up overly structured AI sentences
        const patterns = [
            /\b(Furthermore|Moreover|Additionally|In addition),\s*/gi,
            /\b(However|Nevertheless|Nonetheless|On the other hand),\s*/gi,
            /\b(Therefore|Thus|Consequently|As a result),\s*/gi,
            /\b(Similarly|Likewise|In the same way),\s*/gi,
            /\b(Conversely|In contrast|Whereas|While),\s*/gi
        ];
        
        let result = text;
        patterns.forEach(pattern => {
            result = result.replace(pattern, (match) => {
                const replacements = [
                    '',
                    'Well, ',
                    'You know, ',
                    'Actually, ',
                    'I mean, ',
                    'Come to think of it, ',
                    'Now, ',
                    'So, ',
                    'But, ',
                    'And, '
                ];
                return replacements[Math.floor(Math.random() * replacements.length)];
            });
        });
        
        return result;
    }
    
    addNaturalInterruptions(text) {
        // Add natural thinking pauses and interruptions
        const interruptions = [
            '... well, ',
            '... you know, ',
            '... I mean, ',
            '... actually, ',
            '... come to think of it, ',
            '... hmm, ',
            '... let me think, ',
            '... wait, ',
            '... hold on, ',
            '... actually, wait, '
        ];
        
        let result = text;
        const sentences = result.split(/(?<=[.!?])\s+/);
        
        for (let i = 0; i < sentences.length; i++) {
            if (Math.random() < 0.15 && sentences[i].length > 50) {
                const interruption = interruptions[Math.floor(Math.random() * interruptions.length)];
                const midPoint = Math.floor(sentences[i].length * (0.4 + Math.random() * 0.2));
                sentences[i] = sentences[i].slice(0, midPoint) + interruption + sentences[i].slice(midPoint);
            }
        }
        
        return sentences.join(' ');
    }
    
    varySentenceRhythm(text) {
        // Vary sentence length and structure to avoid AI uniformity
        const sentences = text.split(/(?<=[.!?])\s+/);
        let result = [];
        
        for (let i = 0; i < sentences.length; i++) {
            let sentence = sentences[i];
            
            // Occasionally break long sentences
            if (sentence.length > 120 && Math.random() < 0.3) {
                const breakPoints = sentence.match(/[,;]\s+/g);
                if (breakPoints && breakPoints.length > 0) {
                    const breakIndex = sentence.lastIndexOf(breakPoints[Math.floor(breakPoints.length / 2)]);
                    if (breakIndex > sentence.length * 0.3 && breakIndex < sentence.length * 0.7) {
                        const firstPart = sentence.slice(0, breakIndex + 1);
                        const secondPart = sentence.slice(breakIndex + 1).trim();
                        result.push(firstPart);
                        result.push(secondPart);
                        continue;
                    }
                }
            }
            
            // Occasionally combine short sentences
            if (sentence.length < 40 && i < sentences.length - 1 && sentences[i + 1].length < 40 && Math.random() < 0.2) {
                const connector = Math.random() < 0.5 ? ' and ' : ' but ';
                sentence = sentence.replace(/[.!?]$/, '') + connector + sentences[i + 1].replace(/^[A-Z]/, c => c.toLowerCase());
                i++; // Skip next sentence
            }
            
            result.push(sentence);
        }
        
        return result.join(' ');
    }
    
    addImperfectTransitions(text) {
        // Replace perfect AI transitions with imperfect human ones
        const imperfectTransitions = {
            'Furthermore': ['Also', 'And', 'Plus', 'Besides'],
            'Moreover': ['Also', 'And', 'Plus', 'Besides'],
            'Additionally': ['Also', 'And', 'Plus', 'Besides'],
            'However': ['But', 'Still', 'Yet', 'Though'],
            'Nevertheless': ['But', 'Still', 'Yet', 'Though'],
            'Therefore': ['So', 'Thus', 'Hence'],
            'Consequently': ['So', 'Thus', 'Hence'],
            'In conclusion': ['So', 'To sum up', 'In short'],
            'In summary': ['So', 'To sum up', 'In short'],
            'On the other hand': ['But', 'However', 'Still'],
            'In contrast': ['But', 'However', 'Still']
        };
        
        let result = text;
        Object.keys(imperfectTransitions).forEach(formal => {
            const pattern = new RegExp(`\\b${formal}\\b`, 'gi');
            result = result.replace(pattern, () => {
                const options = imperfectTransitions[formal];
                return options[Math.floor(Math.random() * options.length)];
            });
        });
        
        return result;
    }
    
    addMinorInconsistencies(text) {
        // Add minor human-like inconsistencies
        let result = text;
        
        // Occasionally repeat words (human stammer)
        result = result.replace(/\b(\w+)\s+(\w+)\s+(\w+)\b/g, (match, word1, word2, word3) => {
            if (Math.random() < 0.02) {
                return `${word1} ${word1} ${word2} ${word3}`;
            }
            return match;
        });
        
        // Occasionally use informal contractions
        const informalContractions = [
            { formal: 'going to', informal: 'gonna' },
            { formal: 'want to', informal: 'wanna' },
            { formal: 'got to', informal: 'gotta' },
            { formal: 'have to', informal: 'hafta' },
            { formal: 'ought to', informal: 'oughta' }
        ];
        
        informalContractions.forEach(({ formal, informal }) => {
            const pattern = new RegExp(`\\b${formal}\\b`, 'gi');
            result = result.replace(pattern, (match) => {
                return Math.random() < 0.1 ? informal : match;
            });
        });
        
        return result;
    }
    
    introduceNaturalErrors(text) {
        // Introduce very minor, natural-looking errors
        let result = text;
        
        // Occasionally misspell very common words (very subtle)
        const subtleMisspellings = [
            { correct: 'definitely', misspelled: 'definately' },
            { correct: 'separate', misspelled: 'seperate' },
            { correct: 'occurred', misspelled: 'occured' },
            { correct: 'accommodate', misspelled: 'accomodate' },
            { correct: 'necessary', misspelled: 'neccessary' }
        ];
        
        subtleMisspellings.forEach(({ correct, misspelled }) => {
            const pattern = new RegExp(`\\b${correct}\\b`, 'gi');
            result = result.replace(pattern, (match) => {
                return Math.random() < 0.05 ? misspelled : match;
            });
        });
        
        // Occasionally add extra spaces (typing error)
        result = result.replace(/\b(\w+)\s+(\w+)\b/g, (match, word1, word2) => {
            if (Math.random() < 0.03) {
                return `${word1}  ${word2}`;
            }
            return match;
        });
        
        return result;
    }
    
    varyWordChoice(text) {
        // Vary word choice to avoid AI repetition patterns
        const synonymVariations = {
            'important': ['important', 'crucial', 'key', 'vital', 'essential'],
            'significant': ['significant', 'notable', 'major', 'considerable'],
            'effective': ['effective', 'efficient', 'successful', 'productive'],
            'complex': ['complex', 'complicated', 'intricate', 'sophisticated'],
            'simple': ['simple', 'straightforward', 'basic', 'easy'],
            'difficult': ['difficult', 'hard', 'challenging', 'tough'],
            'good': ['good', 'great', 'excellent', 'fantastic', 'wonderful'],
            'bad': ['bad', 'poor', 'terrible', 'awful'],
            'big': ['big', 'large', 'huge', 'massive', 'enormous'],
            'small': ['small', 'tiny', 'little', 'minor'],
            'very': ['very', 'really', 'quite', 'pretty', 'fairly'],
            'many': ['many', 'lots of', 'plenty of', 'numerous'],
            'some': ['some', 'a few', 'several', 'a couple of']
        };
        
        let result = text;
        Object.keys(synonymVariations).forEach(word => {
            const pattern = new RegExp(`\\b${word}\\b`, 'gi');
            let count = 0;
            result = result.replace(pattern, (match) => {
                count++;
                // Vary every other occurrence
                if (count % 2 === 0) {
                    const options = synonymVariations[word];
                    return options[Math.floor(Math.random() * options.length)];
                }
                return match;
            });
        });
        
        return result;
    }
    
    semanticVariation(text, intensity) {
        // Advanced semantic variation to evade detection
        if (intensity === 'strong') {
            // Replace complex academic phrases with simpler equivalents
            const academicSimplifications = [
                { pattern: /\bin order to\b/gi, replacement: 'to' },
                { pattern: /\bdue to the fact that\b/gi, replacement: 'because' },
                { pattern: /\bfor the reason that\b/gi, replacement: 'because' },
                { pattern: /\bin spite of the fact that\b/gi, replacement: 'even though' },
                { pattern: /\bdespite the fact that\b/gi, replacement: 'even though' },
                { pattern: /\bwith regard to\b/gi, replacement: 'about' },
                { pattern: /\bin relation to\b/gi, replacement: 'about' },
                { pattern: /\bwith respect to\b/gi, replacement: 'about' },
                { pattern: /\bpertaining to\b/gi, replacement: 'about' },
                { pattern: /\bconcerning\b/gi, replacement: 'about' },
                { pattern: /\bregarding\b/gi, replacement: 'about' },
                { pattern: /\butilize\b/gi, replacement: 'use' },
                { pattern: /\bemploy\b/gi, replacement: 'use' },
                { pattern: /\bimplement\b/gi, replacement: 'use' },
                { pattern: /\bdemonstrate\b/gi, replacement: 'show' },
                { pattern: /\bindicate\b/gi, replacement: 'show' },
                { pattern: /\bsignify\b/gi, replacement: 'show' },
                { pattern: /\billustrate\b/gi, replacement: 'show' },
                { pattern: /\bhighlight\b/gi, replacement: 'point out' },
                { pattern: /\bemphasize\b/gi, replacement: 'stress' },
                { pattern: /\bunderscore\b/gi, replacement: 'stress' }
            ];
            
            let result = text;
            academicSimplifications.forEach(({ pattern, replacement }) => {
                result = result.replace(pattern, replacement);
            });
            
            return result;
        }
        
        return text;
    }
    
    contextualSynonymReplacement(text, intensity) {
        // Context-aware synonym replacement
        if (intensity === 'medium' || intensity === 'strong') {
            // Replace common AI signature words
            const aiSignatureWords = {
                'crucial': ['important', 'key', 'essential', 'vital'],
                'paramount': ['important', 'key', 'essential'],
                'imperative': ['important', 'necessary', 'needed'],
                'essential': ['important', 'necessary', 'needed'],
                'significant': ['important', 'notable', 'major'],
                'substantial': ['large', 'big', 'considerable'],
                'considerable': ['large', 'big', 'substantial'],
                'notable': ['important', 'significant', 'worth noting'],
                'remarkable': ['amazing', 'extraordinary', 'notable'],
                'exceptional': ['outstanding', 'extraordinary', 'amazing'],
                'outstanding': ['excellent', 'great', 'exceptional'],
                'excellent': ['great', 'wonderful', 'fantastic'],
                'fantastic': ['great', 'wonderful', 'excellent'],
                'wonderful': ['great', 'excellent', 'fantastic'],
                'optimal': ['best', 'ideal', 'perfect'],
                'ideal': ['perfect', 'best', 'optimal'],
                'efficient': ['effective', 'productive', 'good'],
                'effective': ['efficient', 'productive', 'successful'],
                'successful': ['effective', 'efficient', 'productive']
            };
            
            let result = text;
            Object.keys(aiSignatureWords).forEach(word => {
                const pattern = new RegExp(`\\b${word}\\b`, 'gi');
                result = result.replace(pattern, (match) => {
                    const options = aiSignatureWords[word];
                    return options[Math.floor(Math.random() * options.length)];
                });
            });
            
            return result;
        }
        
        return text;
    }
    
    addHumanTouches(text, intensity, tone = 'casual') {
        const humanTouches = [
            'Honestly, ',
            'You know, ',
            'I mean, ',
            'Actually, ',
            'Well, ',
            'Basically, ',
            'Really, ',
            'I guess, ',
            'I suppose, ',
            'Come to think of it, ',
            'Now that I think about it, ',
            'Looking back, ',
            'In my experience, ',
            'From what I\'ve seen, ',
            'I\'ve noticed that ',
            'It seems to me that ',
            'I feel like ',
            'I believe that ',
            'I think that ',
            'To be honest, ',
            'Truthfully, ',
            'Seriously though, ',
            'Funny thing is, ',
            'Weird thing is, ',
            'Interesting thing is, ',
            'Crazy thing is, ',
            'Believe it or not, ',
            'You won\'t believe this, but ',
            'I\'ll tell you what, ',
            'Here\'s the thing, ',
            'Here\'s what I think, ',
            'Let me tell you, ',
            'Let me put it this way, ',
            'The way I see it, ',
            'As far as I\'m concerned, ',
            'In my humble opinion, ',
            'If you ask me, ',
            'Personally speaking, ',
            'From my perspective, ',
            'From where I stand, ',
            'The thing is, ',
            'Thing is, ',
            'I\'ll be honest with you, ',
            'I\'m not gonna lie, ',
            'I\'m just saying, ',
            'Don\'t get me wrong, ',
            'Not gonna lie, ',
            'Real talk, ',
            'No joke, ',
            'Seriously, ',
            'For real though, ',
            'I kid you not, ',
            'I swear, ',
            'I promise you, ',
            'Cross my heart, ',
            'Scout\'s honor, ',
            'Hand to God, ',
            'I\'m telling you, ',
            'Trust me, ',
            'Believe me, ',
            'Take my word for it, ',
            'I\'ve been thinking, ',
            'I\'ve been wondering, ',
            'I\'ve been meaning to say, ',
            'It just occurred to me, ',
            'It suddenly hit me, ',
            'I just realized, ',
            'I\'ve come to realize, ',
            'I\'ve learned that ',
            'I\'ve discovered that ',
            'I\'ve found out that ',
            'Turns out, ',
            'Apparently, ',
            'Supposedly, ',
            'Reportedly, ',
            'Allegedly, ',
            'Rumor has it, ',
            'Word is, ',
            'They say, ',
            'People say, ',
            'Everyone knows, ',
            'It\'s common knowledge that ',
            'Everyone\'s talking about how ',
            'You\'ve probably heard that ',
            'You might have noticed that ',
            'If you\'ve been paying attention, ',
            'I\'m sure you\'ve seen how ',
            'We all know that ',
            'Let\'s face it, ',
            'Let\'s be real, ',
            'Let\'s be honest, ',
            'Face it, ',
            'Admit it, ',
            'You know what? ',
            'You know what I mean? ',
            'You feel me? ',
            'Am I right? ',
            'Know what I\'m saying? ',
            'Catch my drift? ',
            'See what I\'m saying? ',
            'Does that make sense? ',
            'Are you with me? ',
            'Following me so far? ',
            'Still with me? ',
            'I\'m not sure if I\'m making sense, but ',
            'I hope I\'m explaining this right, ',
            'I might be wrong, but ',
            'I could be mistaken, but ',
            'Don\'t quote me on this, but ',
            'Correct me if I\'m wrong, but ',
            'I\'m no expert, but ',
            'I\'m not an expert or anything, but ',
            'I\'m just spitballing here, but ',
            'This is just off the top of my head, but ',
            'I\'m thinking out loud here, but ',
            'Bear with me here, ',
            'Stay with me on this, ',
            'Hear me out, ',
            'Just hear me out, ',
            'Give me a second here, ',
            'Let me back up for a second, ',
            'Let me start over, ',
            'Where was I? ',
            'What was I saying? ',
            'Oh yeah, ',
            'Anyway, ',
            'Anyways, ',
            'So anyway, ',
            'But anyway, ',
            'But I digress, ',
            'I\'m getting off track, ',
            'I\'m rambling, ',
            'I\'m going off on a tangent, ',
            'Long story short, ',
            'To make a long story short, ',
            'In a nutshell, ',
            'Bottom line, ',
            'At the end of the day, ',
            'When all is said and done, ',
            'All things considered, ',
            'Taking everything into account, ',
            'All in all, ',
            'For the most part, ',
            'Generally speaking, ',
            'Most of the time, ',
            'Nine times out of ten, ',
            'More often than not, ',
            'Usually, ',
            'Typically, ',
            'Normally, ',
            'As a rule, ',
            'As usual, ',
            'Like always, ',
            'Like I always say, ',
            'Like I was saying, ',
            'Where was I going with this? ',
            'What was my point? ',
            'Oh right, ',
            'That\'s right, ',
            'That\'s what I was saying, ',
            'That reminds me, ',
            'Speaking of which, ',
            'While I\'m on the subject, ',
            'Since we\'re talking about this, ',
            'This brings me to my next point, ',
            'Which brings us to, ',
            'Moving on, ',
            'Next up, ',
            'Now then, ',
            'So then, ',
            'Alright then, ',
            'Okay then, ',
            'Right then, ',
            'Well then, ',
            'So there you have it, ',
            'And there you go, ',
            'That\'s pretty much it, ',
            'That about covers it, ',
            'I think that\'s everything, ',
            'I believe that\'s all, ',
            'I\'m pretty sure that\'s it, ',
            'Unless I forgot something, ',
            'Did I miss anything? ',
            'Am I forgetting something? ',
            'What else? ',
            'Anything else? ',
            'Where was I going with this again? '
        ];

        const sentences = text.split(/(?<=[.!?])\s+/);
        let touchedText = '';
        
        for (let i = 0; i < sentences.length; i++) {
            let sentence = sentences[i];
            
            const baseChance =
                intensity === 'light' ? 0.05 :
                intensity === 'medium' ? 0.15 :
                0.25;
            const toneBoost = tone === 'casual' ? 0.08 : (tone === 'professional' ? 0.02 : 0);
            const chance = Math.min(0.4, baseChance + toneBoost);

            if (Math.random() < chance && sentence.length > 20) {
                const touch = humanTouches[Math.floor(Math.random() * humanTouches.length)];
                sentence = touch + sentence;
            }
            
            touchedText += sentence + ' ';
        }
        
        return touchedText.trim();
    }
    
    copyResult() {
        const text = this.elements.humanOutput.textContent;
        if (text === 'Your humanized text will appear here...') {
            this.showError('No text to copy');
            return;
        }
        
        navigator.clipboard.writeText(text)
            .then(() => {
                const originalText = this.elements.copyButton.textContent;
                this.elements.copyButton.textContent = 'Copied!';
                setTimeout(() => {
                    this.elements.copyButton.textContent = originalText;
                }, 2000);
            })
            .catch(() => {
                this.showError('Failed to copy text');
            });
    }
    
    clearAll() {
        this.elements.aiInput.value = '';
        if (this.elements.humanOutput) {
            this.elements.humanOutput.textContent = 'Your humanized text will appear here...';
        }
        if (this.elements.aiScoreValue) {
            this.elements.aiScoreValue.textContent = '0%';
        }
        if (this.elements.humanScoreValue) {
            this.elements.humanScoreValue.textContent = '0%';
        }
        if (this.elements.aiScoreBar) {
            this.elements.aiScoreBar.style.width = '0%';
        }
        if (this.elements.humanScoreBar) {
            this.elements.humanScoreBar.style.width = '0%';
        }
        if (this.elements.detectorSummary) {
            this.elements.detectorSummary.textContent = 'Paste text and run detection to see how AI-like it looks.';
        }
        this.elements.charCount.textContent = '0 characters';
        this.elements.processingTime.textContent = 'Ready';
        this.elements.processingTime.className = '';
        this.elements.aiInput.focus();
        this.saveState();
    }
    
    setLoading(loading) {
        if (loading) {
            this.elements.humanizeButton.disabled = true;
            if (this.currentMode === 'detect') {
                this.elements.humanizeButton.textContent = 'Detecting...';
                this.elements.processingTime.textContent = 'Analyzing text for AI patterns...';
                if (this.elements.container) {
                    this.elements.container.classList.add('loading');
                }
            } else {
                this.elements.humanizeButton.textContent = 'Decrypting...';
                this.elements.humanOutput.textContent = 'Running multi-stage humanization routine...';
                this.elements.processingTime.textContent = 'Decrypting AI signature...';
                if (this.elements.scanOverlay) {
                    this.elements.scanOverlay.classList.add('active');
                }
                if (this.elements.container) {
                    this.elements.container.classList.add('loading');
                }
                this.startScanAnimation();
            }
        } else {
            this.elements.humanizeButton.disabled = false;
            this.elements.humanizeButton.textContent = this.currentMode === 'detect' ? 'Detect AI' : 'Humanize Text';
            if (this.currentMode === 'humanize' && this.elements.scanOverlay) {
                this.elements.scanOverlay.classList.remove('active');
            }
            if (this.elements.container) {
                this.elements.container.classList.remove('loading');
            }
            if (this.currentMode === 'humanize') {
                this.stopScanAnimation();
            }
        }
    }
    
    showError(message) {
        this.elements.processingTime.textContent = message;
        this.elements.processingTime.className = 'error';
        
        setTimeout(() => {
            this.elements.processingTime.textContent = 'Ready';
            this.elements.processingTime.className = '';
        }, 3000);
    }
    
    getKeepTerms() {
        const raw = (this.elements.keepTerms && this.elements.keepTerms.value) || '';
        return raw.split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    
    protectTerms(text, terms) {
        if (!terms.length) return { text, instances: [] };
        let result = text;
        const instances = [];
        let idx = 0;
        terms.forEach(term => {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const re = new RegExp(escaped, 'gi');
            result = result.replace(re, (m) => {
                const token = `__KEEP_${idx++}__`;
                instances.push({ token, original: m });
                return token;
            });
        });
        return { text: result, instances };
    }
    
    unprotectTerms(text, instances) {
        if (!instances.length) return text;
        let result = text;
        instances.forEach(({ token, original }) => {
            const re = new RegExp(token, 'g');
            result = result.replace(re, original);
        });
        return result;
    }
    
    loadExample(id) {
        const examples = {
            1: "In conclusion, the methodology demonstrates efficiency and effectiveness in various contexts. However, it is important to note that further analysis may be required.",
            2: "This paper aims to illustrate the fundamental concepts of data structures. Subsequently, the results indicate optimal performance under specific conditions."
        };
        const text = examples[id] || examples[1];
        this.elements.aiInput.value = text;
        this.updateCharCount();
        this.saveState();
        if (this.currentMode === 'detect') {
            this.queueDebouncedDetect();
        }
    }
    
    exportReport() {
        const inputText = this.elements.aiInput.value.trim();
        if (!inputText) {
            this.showError('No text to export report for');
            return;
        }
        const result = this.analyzeAIConfidence(inputText);
        const metrics = this.computeReadabilityMetrics(inputText);
        const sentences = this.scoreSentences(inputText).slice(0, 8);
        const lines = [];
        lines.push(`AI score: ${result.aiScore}%`);
        lines.push(`Human score: ${result.humanScore}%`);
        lines.push(`Verdict: ${result.verdict}`);
        lines.push(`Editing: ${result.editingLabel}`);
        lines.push(`Reasons: ${result.reasons.join(', ')}`);
        lines.push(`Flesch: ${metrics.fleschScore}`);
        lines.push(`FK Grade: ${metrics.kincaidGrade}`);
        lines.push(`Passive: ${(metrics.passiveVoiceRatio*100).toFixed(0)}%`);
        lines.push(`Stopwords: ${(metrics.stopwordRatio*100).toFixed(0)}%`);
        lines.push(`Punct types: ${metrics.punctTypes}`);
        lines.push(`Top sentences:`);
        sentences.forEach(s => {
            lines.push(`- [${s.score}] ${s.text}`);
        });
        const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'humanlify-report.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    rewriteHighRisk() {
        const inputText = this.elements.aiInput.value.trim();
        if (!inputText) {
            this.showError('No text to rewrite');
            return;
        }
        const sentences = this.scoreSentences(inputText);
        const parts = inputText.split(/(?<=[.!?])\s+/);
        const map = new Map();
        sentences.forEach(s => {
            if (s.score >= 8) {
                map.set(s.text, this.applyParaphrasing(s.text, 'strong', this.getTone()));
            }
        });
        const rebuilt = parts.map(p => map.has(p.trim()) ? map.get(p.trim()) : p).join(' ');
        const output = this.processText(rebuilt, 'medium', this.getTone());
        this.elements.humanOutput.textContent = output;
    }
    
    applyTheme() {
        const theme = (this.elements.themeSelect && this.elements.themeSelect.value) || 'green';
        if (theme === 'cyan') {
            document.body.classList.add('theme-cyan');
        } else {
            document.body.classList.remove('theme-cyan');
        }
    }
    
    startScanAnimation() {
        if (!this.elements.scanText) {
            return;
        }
        const messages = [
            'Scanning tokens for robotic patterns...',
            'Rewriting structure to match human cadence...',
            'Injecting natural hesitations and phrasing...',
            'Balancing formality and casual tone...',
            'Finalizing human-readable output...'
        ];
        let index = 0;
        this.elements.scanText.textContent = messages[0];
        if (this.scanTimer) {
            clearInterval(this.scanTimer);
        }
        this.scanTimer = setInterval(() => {
            index = (index + 1) % messages.length;
            this.elements.scanText.textContent = messages[index];
        }, 650);
    }
    
    stopScanAnimation() {
        if (this.scanTimer) {
            clearInterval(this.scanTimer);
            this.scanTimer = null;
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextHumanizer();
});

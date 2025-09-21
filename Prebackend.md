graph TD
    A[User Clicks 'Get Recommendations' Button] --> B[Backend: Get current board content]
    B --> C[Backend: Generate search queries via NLP/LLM]
    C --> D1[Query 1: &quot;divergent thinking&quot;]
    C --> D2[Query 2: &quot;creative block&quot;]
    C --> D3[Query 3: &quot;brainstorm case study&quot;]
    
    D1 --> E1[Call Google Books API]
    D2 --> E2[Call YouTube Data API]
    D3 --> E3[Call Google Search API]
    D1 --> E4[Query Vector DB for Public Boards]
    
    E1 --> F[Fetch Results]
    E2 --> F
    E3 --> F
    E4 --> F
    
    F --> G[Backend: Deduplicate, Filter, & Rank Results]
    G --> H[Backend: Return structured JSON to UI]
    H --> I[Frontend: Display beautiful list of recommendations]



    graph TD
    A[User Clicks 'Recommend' in React/Next.js] --> B[Next.js app calls Supabase Edge Function '/get-recommendations' with board text]

    subgraph Supabase Edge Function [TypeScript Logic]
        C[Receive board text]
        C --> D[Call OpenAI API to generate search queries]
        D --> E[For each query, call external APIs in parallel]
        E --> F[Call YouTube API]
        E --> G[Call Books API]
        E --> H[Call Web Search API]
        E --> I[Query Supabase DB via pg_vector for similar public boards]
        F & G & H & I --> J[Combine, filter, and rank all results]
        J --> K[Return structured JSON response]
    end

    K --> L[Next.js/React app receives data and displays it in the UI]
# 🚀 AI Agent Center - Quick Start Guide

## Bắt Đầu Nhanh trong 15 Phút

### 📋 Prerequisites

- Python 3.10+
- Node.js 18+ (cho frontend)
- Git
- API keys cho LLM providers (OpenAI, Anthropic, etc.)

---

## ⚡ Cài Đặt Nhanh

### Bước 1: Cài Đặt Dependencies

```bash
cd personal-ai-system

# Install AI Agent frameworks
pip install -r requirements-aiagent.txt

# Verify installation
python -c "import langgraph, crewai; print('✅ All frameworks installed!')"
```

### Bước 2: Cấu Hình Environment

Thêm vào file `.env`:

```env
# LangChain/LangGraph
LANGCHAIN_API_KEY=your_langsmith_key
LANGCHAIN_TRACING_V2=true
LANGCHAIN_PROJECT=long-sang-forge

# LLM Providers
OPENAI_API_KEY=sk-your-openai-key
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Vector Store (optional)
CHROMA_DB_PATH=./data/chroma

# Monitoring (optional)
LANGFUSE_PUBLIC_KEY=pk-your-key
LANGFUSE_SECRET_KEY=sk-your-key
```

### Bước 3: Test Cài Đặt

```bash
# Test LangGraph
python -c "from core.orchestrator import LangGraphOrchestrator; print('✅ LangGraph ready')"

# Test CrewAI
python -c "from agents.specialized.content_creator_crew import ContentCreatorCrew; print('✅ CrewAI ready')"
```

---

## 🎯 Examples - Sử Dụng Ngay

### Example 1: Sequential Workflow với LangGraph

Tạo file `examples/sequential_workflow.py`:

```python
import asyncio
from core.orchestrator import LangGraphOrchestrator, WorkflowBuilder
from agents import WorkAgent, ResearchAgent

async def main():
    # Initialize orchestrator
    orchestrator = LangGraphOrchestrator()
    
    # Register agents
    work_agent = WorkAgent()
    research_agent = ResearchAgent()
    
    orchestrator.register_agent("work_agent", work_agent)
    orchestrator.register_agent("research_agent", research_agent)
    
    # Build workflow
    builder = WorkflowBuilder(orchestrator)
    builder.sequential(
        name="content_pipeline",
        steps=[
            ("research", "research_agent"),
            ("write", "work_agent"),
            ("edit", "work_agent")
        ]
    )
    
    # Execute
    result = await orchestrator.execute({
        "task": "Write about AI agent frameworks"
    })
    
    print("✅ Workflow completed!")
    print(f"Status: {result['status']}")
    print(f"Results: {result['results']}")

if __name__ == "__main__":
    asyncio.run(main())
```

Chạy:

```bash
python examples/sequential_workflow.py
```

---

### Example 2: Content Creation với CrewAI

Tạo file `examples/crewai_content.py`:

```python
import asyncio
from agents.specialized.content_creator_crew import ContentCreatorCrew

async def main():
    # Initialize crew
    crew = ContentCreatorCrew(
        llm_provider="openai",
        model="gpt-4o"
    )
    
    # Create content
    result = await crew.create_content(
        topic="The Future of AI Agents",
        keywords=["AI", "automation", "agents", "LangGraph"],
        tone="professional"
    )
    
    if result["success"]:
        print("✅ Content created successfully!")
        print(f"\nContent:\n{result['content']}")
    else:
        print(f"❌ Error: {result['error']}")

if __name__ == "__main__":
    asyncio.run(main())
```

Chạy:

```bash
python examples/crewai_content.py
```

---

### Example 3: Parallel Workflow

Tạo file `examples/parallel_workflow.py`:

```python
import asyncio
from core.orchestrator import LangGraphOrchestrator, WorkflowBuilder
from agents import WorkAgent, ResearchAgent

async def main():
    orchestrator = LangGraphOrchestrator()
    
    # Register agents
    work_agent = WorkAgent()
    research_agent = ResearchAgent()
    
    orchestrator.register_agent("work_agent", work_agent)
    orchestrator.register_agent("research_agent", research_agent)
    
    # Build parallel workflow
    builder = WorkflowBuilder(orchestrator)
    builder.parallel(
        name="multi_channel_content",
        parallel_steps=[
            ("blog_post", "work_agent"),
            ("social_media", "work_agent"),
            ("email", "work_agent")
        ],
        aggregator=("summary", "research_agent")
    )
    
    # Execute
    result = await orchestrator.execute({
        "task": "Create marketing content about our new product"
    })
    
    print("✅ Parallel workflow completed!")
    print(f"Results: {result['results']}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

### Example 4: Conditional Workflow

Tạo file `examples/conditional_workflow.py`:

```python
import asyncio
from core.orchestrator import LangGraphOrchestrator, WorkflowBuilder
from agents import WorkAgent, ResearchAgent

async def main():
    orchestrator = LangGraphOrchestrator()
    
    work_agent = WorkAgent()
    research_agent = ResearchAgent()
    
    orchestrator.register_agent("work_agent", work_agent)
    orchestrator.register_agent("research_agent", research_agent)
    
    # Define condition
    def decide_complexity(state):
        """Decide content complexity based on context."""
        complexity = state.context.get("complexity", "standard")
        return complexity
    
    # Build conditional workflow
    builder = WorkflowBuilder(orchestrator)
    builder.conditional(
        name="adaptive_content",
        initial_step=("analyze", "research_agent"),
        condition=decide_complexity,
        branches={
            "simple": [("quick_write", "work_agent")],
            "standard": [("research", "research_agent"), ("write", "work_agent")],
            "complex": [
                ("deep_research", "research_agent"),
                ("outline", "work_agent"),
                ("write", "work_agent"),
                ("review", "work_agent")
            ]
        }
    )
    
    # Execute with different complexity levels
    for complexity in ["simple", "standard", "complex"]:
        print(f"\n🔄 Running with complexity: {complexity}")
        
        result = await orchestrator.execute({
            "task": "Write about quantum computing",
            "complexity": complexity
        })
        
        print(f"✅ Completed: {result['status']}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

### Example 5: Using Pre-built Templates

Tạo file `examples/use_templates.py`:

```python
import asyncio
from core.orchestrator import LangGraphOrchestrator, WorkflowTemplates
from agents import WorkAgent, ResearchAgent

async def main():
    orchestrator = LangGraphOrchestrator()
    
    # Register agents
    work_agent = WorkAgent()
    research_agent = ResearchAgent()
    
    orchestrator.register_agent("work_agent", work_agent)
    orchestrator.register_agent("research_agent", research_agent)
    
    # Use pre-built template
    WorkflowTemplates.content_creation_pipeline(orchestrator)
    
    # Execute
    result = await orchestrator.execute({
        "task": "Create comprehensive guide about AI agents"
    })
    
    print("✅ Template workflow completed!")
    print(f"Results: {result['results']}")

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 🔧 Advanced Usage

### Custom Agent Integration

Tạo file `examples/custom_agent.py`:

```python
from core.base_agent import BaseAgent
from typing import Dict, Any

class CustomAnalyticsAgent(BaseAgent):
    """Custom agent for analytics."""
    
    def __init__(self):
        super().__init__(name="custom_analytics", role="Data Analyst")
    
    async def process(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        task = input_data.get("task", "")
        
        # Your custom logic here
        analysis_result = {
            "insights": ["Insight 1", "Insight 2"],
            "recommendations": ["Rec 1", "Rec 2"],
            "metrics": {"accuracy": 0.95}
        }
        
        return {
            "response": f"Analysis complete for: {task}",
            "data": analysis_result
        }

# Register and use
async def main():
    from core.orchestrator import LangGraphOrchestrator
    
    orchestrator = LangGraphOrchestrator()
    custom_agent = CustomAnalyticsAgent()
    
    orchestrator.register_agent("analytics", custom_agent)
    
    # Now use it in workflows
    # ...
```

---

### Streaming Results

```python
import asyncio
from core.orchestrator import LangGraphOrchestrator, WorkflowBuilder
from agents import WorkAgent

async def main():
    orchestrator = LangGraphOrchestrator()
    work_agent = WorkAgent()
    
    orchestrator.register_agent("work_agent", work_agent)
    
    # Build workflow
    builder = WorkflowBuilder(orchestrator)
    builder.sequential(
        name="content_workflow",
        steps=[
            ("research", "work_agent"),
            ("write", "work_agent"),
            ("edit", "work_agent")
        ]
    )
    
    # Stream execution
    print("🔄 Streaming workflow execution...\n")
    
    async for update in orchestrator.stream_execute({
        "task": "Write about AI trends"
    }):
        print(f"📍 Current agent: {update.get('current_agent')}")
        print(f"   Status: {update.get('status')}")
        if update.get('latest_result'):
            print(f"   Result: {update['latest_result']}")
        print()

if __name__ == "__main__":
    asyncio.run(main())
```

---

## 🎨 Integration với Existing System

### Thêm vào Integration API

Cập nhật `personal-ai-system/api/integration.py`:

```python
from core.orchestrator import LangGraphOrchestrator, WorkflowBuilder
from agents.specialized.content_creator_crew import ContentCreatorCrew

# Add new endpoint
@router.post("/workflows/langgraph/execute")
async def execute_langgraph_workflow(
    workflow_type: str,
    task: str,
    context: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """Execute a LangGraph workflow."""
    try:
        orchestrator = LangGraphOrchestrator()
        
        # Register agents
        orchestrator.register_agent("work_agent", work_agent)
        orchestrator.register_agent("research_agent", research_agent)
        
        # Build workflow based on type
        builder = WorkflowBuilder(orchestrator)
        
        if workflow_type == "sequential":
            builder.sequential(
                name="dynamic_sequential",
                steps=[
                    ("research", "research_agent"),
                    ("write", "work_agent")
                ]
            )
        elif workflow_type == "parallel":
            builder.parallel(
                name="dynamic_parallel",
                parallel_steps=[
                    ("task1", "work_agent"),
                    ("task2", "work_agent")
                ]
            )
        else:
            raise HTTPException(400, f"Unknown workflow type: {workflow_type}")
        
        # Execute
        result = await orchestrator.execute({
            "task": task,
            **(context or {})
        })
        
        return result
        
    except Exception as e:
        raise HTTPException(500, str(e))


@router.post("/crews/content/create")
async def create_content_with_crew(
    topic: str,
    keywords: Optional[List[str]] = None,
    tone: str = "professional"
) -> Dict[str, Any]:
    """Create content using CrewAI."""
    try:
        crew = ContentCreatorCrew()
        
        result = await crew.create_content(
            topic=topic,
            keywords=keywords,
            tone=tone
        )
        
        return result
        
    except Exception as e:
        raise HTTPException(500, str(e))
```

---

## 📊 Monitoring & Debugging

### Enable LangSmith Tracing

```python
import os

# Set environment variables
os.environ["LANGCHAIN_TRACING_V2"] = "true"
os.environ["LANGCHAIN_PROJECT"] = "long-sang-forge"
os.environ["LANGCHAIN_API_KEY"] = "your-key"

# Now all executions are traced
# View at: https://smith.langchain.com/
```

### Add Logging

```python
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

logger = logging.getLogger(__name__)

# Now you'll see detailed logs during execution
```

---

## 🚀 Next Steps

### 1. Explore More Templates

- Check `core/orchestrator/workflow_builder.py` for more templates
- Create your own custom workflows

### 2. Build Custom Crews

- See `agents/specialized/content_creator_crew.py` as example
- Create crews for your specific use cases

### 3. Add More Agents

- Extend `BaseAgent` for custom agents
- Register them with orchestrator
- Use in workflows

### 4. Create Dashboard

- Build React frontend for workflow management
- Add real-time monitoring
- Visualize workflow execution

### 5. Production Deployment

- Add error handling and retries
- Implement rate limiting
- Setup monitoring and alerts
- Add authentication

---

## 📚 Further Reading

- **LangGraph Docs**: <https://langchain-ai.github.io/langgraph/>
- **CrewAI Docs**: <https://docs.crewai.com/>
- **LangChain Docs**: <https://python.langchain.com/>

---

## ❓ Troubleshooting

### Issue: Import errors

```bash
# Solution: Reinstall dependencies
pip install -r requirements-aiagent.txt --upgrade
```

### Issue: API key not found

```bash
# Solution: Check .env file
cat .env | grep API_KEY
```

### Issue: Workflow not executing

```python
# Solution: Enable debug logging
import logging
logging.basicConfig(level=logging.DEBUG)
```

---

## ✅ Checklist

- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Test examples run successfully
- [ ] Custom agent created
- [ ] Integration with existing API
- [ ] Monitoring setup
- [ ] Ready for production!

---

**Happy Building! 🚀**

Nếu cần hỗ trợ, tham khảo:

- AI_AGENT_CENTER_PLAN.md (Kế hoạch chi tiết)
- Examples folder (Các ví dụ cụ thể)
- Documentation (Tài liệu framework)

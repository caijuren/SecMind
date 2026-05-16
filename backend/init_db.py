from app.database import engine, Base
from app.models.user import User
from app.models.alert import Alert
from app.models.device import Device
from app.models.itsm import ITSMTicket
from app.models.ai_analysis import AIAnalysis
from app.models.system_setting import SystemSetting
from app.models.integration import IntegrationApp, Webhook

models = [User, Alert, Device, ITSMTicket, AIAnalysis, SystemSetting, IntegrationApp, Webhook]

def init_db():
    Base.metadata.create_all(bind=engine)
    print(f"数据库初始化完成，共创建 {len(models)} 张表：")
    for model in models:
        print(f"  ✓ {model.__tablename__}")

if __name__ == "__main__":
    init_db()

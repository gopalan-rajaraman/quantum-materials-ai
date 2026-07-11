import asyncio
import traceback
from app.database.mongodb_config import MongoDB
from app.routes.thermal_cvd_routes import init_thermal_cvd_model, optimizer_instance
import pprint

async def run():
    try:
        await MongoDB.connect()
        init_thermal_cvd_model()
        if optimizer_instance:
            print("Optimizer loaded. Training points:", len(optimizer_instance.y_train))
            try:
                suggestions = optimizer_instance.suggest_next_experiment(n_suggestions=1)
                print("Suggestions:")
                pprint.pprint(suggestions)
            except Exception as e:
                print("Exception in suggest_next_experiment:")
                traceback.print_exc()
        else:
            print("Failed to initialize optimizer.")
    finally:
        await MongoDB.close()

if __name__ == "__main__":
    asyncio.run(run())

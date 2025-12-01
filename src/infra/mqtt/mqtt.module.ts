import { Global, Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { MqttService } from "./mqtt.service";



@Global()
@Module({
   imports: [
      ConfigModule,
      EventEmitterModule.forRoot({
         wildcard: true,
         delimiter: '.',
      })
   ],
   providers: [
      MqttService,
   ],
   exports: [MqttService]
})

export class MqttModule {}
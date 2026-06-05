import { Module } from '@nestjs/common';
import { CvController } from './cv.controller';
import { CvAdaptationService } from './cv-adaptation.service';
import { CvAtsService } from './cv-ats.service';
import { CvExportService } from './cv-export.service';
import { CvParserService } from './cv-parser.service';
import { CvService } from './cv.service';
import { CvVersionService } from './cv-version.service';
import { CvVersionsController } from './cv-versions.controller';
import { CvTemplatesModule } from './cv-templates.controller';

@Module({
  imports: [CvTemplatesModule],
  controllers: [CvController, CvVersionsController],
  providers: [
    CvService,
    CvVersionService,
    CvParserService,
    CvExportService,
    CvAdaptationService,
    CvAtsService,
  ],
  exports: [
    CvService,
    CvVersionService,
    CvExportService,
    CvAdaptationService,
    CvAtsService,
  ],
})
export class CvModule {}

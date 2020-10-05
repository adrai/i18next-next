import i18next, { I18nextInstance } from '../../'
import { expectType } from 'tsd'

expectType<I18nextInstance>(i18next())

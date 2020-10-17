// indexer that is open to any value
export type StringMap = { [key: string]: any }

export interface TOptionsBase {
  // Default value to return if a translation was not found
  defaultValue?: any
}

// Options that allow open ended values for interpolation unless type is provided.
export type TOptions<TInterpolationMap extends Record<string, unknown> = StringMap> = TOptionsBase & TInterpolationMap
export type TFunctionResult = string | Record<string, unknown> | Array<string | Record<string, unknown>> | undefined | null
export type TFunctionKeys = string | TemplateStringsArray
export interface TFunction {
  // basic usage
  <
    TResult extends TFunctionResult = string,
    TKeys extends TFunctionKeys = string,
    TInterpolationMap extends Record<string, unknown> = StringMap
  >(
    key: TKeys | TKeys[],
    options?: TOptions<TInterpolationMap> | string,
  ): TResult
}

declare type ExtendOptionsHandler = (options: Record<string, unknown>) => Record<string, unknown> | Promise<Record<string, unknown>>
declare type LoadResourcesHandler = () => StringMap | Promise<StringMap>

export interface I18nextInstance {
  options: Record<string, unknown>
  // The default of the i18next module is an i18next instance ready to be initialized by calling init.
  init(): Promise<I18nextInstance>

  addHook(name: 'extendOptions', hook: ExtendOptionsHandler): I18nextInstance
  addHook(name: 'loadResources', hook: LoadResourcesHandler): I18nextInstance

  /**
   * Gets fired after initialization.
   */
  on(event: 'initialized', callback: (i18next: I18nextInstance) => void): void

  /**
   * Event listener
   */
  on(event: string, listener: (...args: any[]) => void): void

  // Expose parameterized t in the i18next interface hierarchy
  t: TFunction
}

declare function i18next(opts?: Record<string, unknown>): I18nextInstance

export default i18next

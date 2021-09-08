import should from 'should'
import { deepExtend, deepFind } from '../src/utils.js'

describe('utils', () => {
  describe('#deepExtend', () => {
    it('should overwrite if flag set', () => {
      const res = deepExtend(
        {
          some: 'thing'
        },
        {
          some: 'else'
        },
        true
      )

      should(res).eql({
        some: 'else'
      })
    })

    it('should not overwrite', () => {
      const res = deepExtend(
        {
          some: 'thing'
        },
        {
          some: 'else'
        },
        false
      )

      should(res).eql({
        some: 'thing'
      })
    })
  })

  describe('#deepFind', () => {
    it('should get nested and flat values', () => {
      const obj = {
        a: {
          nested: 'a nested value',
          'more.of': {
            nested: {
              here: {
                wow: 'cool'
              },
              'and.even.more': {
                gaga: 'strange'
              }
            }
          }
        },
        'a.flat': 'a flat value',
        'b.flat': {
          nested: 'mix value',
          more: {
            nesting: 'deep',
            'flat.again': 'deep flat'
          },
          more2: {
            'flat.again': 'deep flat',
            deeper: {
              key: 'very deep'
            }
          }
        },
        str: 'whatever',
        arr: [
          null
        ]
      }

      const n = deepFind(obj, 'a.nested')
      should(n).eql('a nested value')
      const f = deepFind(obj, 'a.flat')
      should(f).eql('a flat value')
      const m = deepFind(obj, 'b.flat.nested')
      should(m).eql('mix value')
      const d = deepFind(obj, 'b.flat.more.nesting')
      should(d).eql('deep')
      const df = deepFind(obj, 'b.flat.more.flat.again')
      should(df).eql('deep flat')
      const df2 = deepFind(obj, 'b.flat.more2.flat.again')
      should(df2).eql('deep flat')
      const v = deepFind(obj, 'b.flat.more2.deeper.key')
      should(v).eql('very deep')
      const co = deepFind(obj, 'a.more.of.nested.here.wow')
      should(co).eql('cool')
      const gaga = deepFind(obj, 'a.more.of.nested.and.even.more.gaga')
      should(gaga).eql('strange')
      const fls = deepFind(obj, 'a.wrong')
      should(fls).eql(undefined)
      const fls2 = deepFind(obj, 'str.wrong')
      should(fls2).eql(undefined)
      const arr0 = deepFind(obj, 'arr.0')
      should(arr0).eql(null)
      const arr1 = deepFind(obj, 'arr.0.title')
      should(arr1).eql(undefined)
      const arr2 = deepFind(obj, 'arr.1')
      should(arr2).eql(undefined)
      const arr3 = deepFind(obj, 'arr.1.title')
      should(arr3).eql(undefined)
    })
  })
})

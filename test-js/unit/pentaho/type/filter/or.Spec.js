/*!
 * Copyright 2010 - 2016 Pentaho Corporation.  All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
define([
  "pentaho/type/filter/abstract",
  "pentaho/type/filter/and",
  "pentaho/type/filter/or",
  "pentaho/type/filter/not",
  "pentaho/type/Context",
  "pentaho/type/complex"
], function(abstractFactory, andFactory, orFactory, notFactory, Context, complexFactory) {

  "use strict";

  /* global describe:true, it:true, expect:true, beforeEach:true*/

  describe("pentaho.type.filter.Or", function() {

    var context = new Context();
    var AbstractFilter = context.get(abstractFactory);
    var AndFilter = context.get(andFactory);
    var OrFilter = context.get(orFactory);
    var NotFilter = context.get(notFactory);
    var Complex = context.get(complexFactory);
    var CustomFilter = AbstractFilter.extend({_contains: function() { return false; }});

    var ProductSummary = Complex.extend({
      type: {
        props: [
          {name: "name",    type: "string",  label: "Name"    },
          {name: "sales",   type: "number",  label: "Sales"   },
          {name: "inStock", type: "boolean", label: "In Stock"}
        ]
      }
    });

    describe("#kind", function() {

      it("should return 'or'", function() {
        var filter  = new OrFilter();
        expect(filter.kind).toBe("or");
      });
    });

    describe("#contains(elem)", function() {

      var elem = new ProductSummary({name: "A", sales: 12000, inStock: true});

      it("should return `false` if `operands` is empty", function() {

        var filter  = new OrFilter();

        var result = filter.contains(elem);

        expect(result).toBe(false);
      });

      it("should return `true` if all operand filters contain the element", function() {

        var oper1 = new CustomFilter();
        var oper2 = new CustomFilter();

        spyOn(oper1, "_contains").and.returnValue(true);
        spyOn(oper2, "_contains").and.returnValue(true);

        var filter  = new OrFilter({operands: [oper1, oper2]});

        var result = filter.contains(elem);

        expect(result).toBe(true);
      });

      it("should return `true` if only one of the operand filters contains the element", function() {

        var oper1 = new CustomFilter();
        var oper2 = new CustomFilter();

        spyOn(oper1, "_contains").and.returnValue(true);
        spyOn(oper2, "_contains").and.returnValue(false);

        var filter  = new OrFilter({operands: [oper1, oper2]});

        var result = filter.contains(elem);

        expect(result).toBe(true);
      });

      it("should be commutative", function() {

        var oper1 = new CustomFilter();
        var oper2 = new CustomFilter();

        spyOn(oper1, "_contains").and.returnValue(true);
        spyOn(oper2, "_contains").and.returnValue(false);

        var filter  = new OrFilter({operands: [oper1, oper2]});

        var result = filter.contains(elem);

        expect(result).toBe(true);

        filter  = new OrFilter({operands: [oper2, oper1]});

        result = filter.contains(elem);

        expect(result).toBe(true);
      });

      it("should return `false` if none of the operand filters contains the element", function() {

        var oper1 = new CustomFilter();
        var oper2 = new CustomFilter();

        spyOn(oper1, "_contains").and.returnValue(false);
        spyOn(oper2, "_contains").and.returnValue(false);

        var filter  = new OrFilter({operands: [oper1, oper2]});

        var result = filter.contains(elem);

        expect(result).toBe(false);
      });
    }); // #contains

    describe("#negate()", function() {
      it("should return an `And` of negated operands", function() {
        var oper1 = new CustomFilter();
        var oper2 = new CustomFilter();

        var filter = new OrFilter({operands: [oper1, oper2]});

        var invFilter = filter.negate();

        expect(invFilter instanceof AndFilter);

        var opers = invFilter.operands;
        expect(opers.count).toBe(2);

        expect(opers.at(0) instanceof NotFilter).toBe(true);
        expect(opers.at(0).operand).toBe(oper1);

        expect(opers.at(1) instanceof NotFilter).toBe(true);
        expect(opers.at(1).operand).toBe(oper2);
      });
    }); // #negate

    describe("#or(filter, ...)", function() {

      it("should return itself when no operands are given", function() {
        var filter = new OrFilter();
        var result = filter.or();

        expect(result).toBe(filter);
      });

      it("should return itself when only null operands are given", function() {
        var filter = new OrFilter();
        var result = filter.or(null, null);

        expect(result).toBe(filter);
      });

      it("should return the single operand when given an operand and initially empty", function() {
        var filter = new OrFilter();
        var oper1  = new CustomFilter();

        var result = filter.or(oper1);

        expect(result).toBe(oper1);
      });

      it("should return an `Or` filter when given an operand and initially not empty", function() {
        var oper1  = new CustomFilter();
        var filter = new OrFilter({operands: [oper1]});
        var oper2  = new CustomFilter();

        var result = filter.or(oper2);

        expect(result instanceof OrFilter).toBe(true);
      });

      it("should return a new filter when given an operand", function() {
        var oper1  = new CustomFilter();
        var filter = new OrFilter({operands: [oper1]});
        var oper2  = new CustomFilter();

        var result = filter.or(oper2);

        expect(result).not.toBe(filter);
        expect(result).not.toBe(oper1);
        expect(result).not.toBe(oper2);
      });

      it("should add elements instead of creating a tree of Ors", function() {
        var oper1  = new CustomFilter();
        var oper2  = new CustomFilter();
        var filter = new OrFilter({operands: [oper1, oper2]});
        var oper3  = new CustomFilter();

        var result = filter.or(oper3);

        expect(result.operands.count).toBe(3);
      });

      it("should flatten operands of a given Or argument", function() {
        var oper1  = new CustomFilter();
        var oper2  = new CustomFilter();
        var filter1 = new OrFilter({operands: [oper1, oper2]});

        var oper3  = new CustomFilter();
        var filter2 = new OrFilter({operands: [oper3]});

        var result = filter1.or(filter2);

        expect(result.operands.count).toBe(3);
        expect(result.operands.at(0)).toBe(oper1);
        expect(result.operands.at(1)).toBe(oper2);
        expect(result.operands.at(2)).toBe(oper3);
      });
    }); // #or
  }); // pentaho.type.filter.Or
});
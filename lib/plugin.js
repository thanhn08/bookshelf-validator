module.exports = function(Bookshelf) {
    "use strict"
    var proto  = Bookshelf.Model.prototype
    var EValidator = require('evalidator')
    var ValidationError = require('./validation-error')

    var Model = Bookshelf.Model.extend({

        // Validation rules
        validation: {},

        constructor: function() {
            var evalidator = new EValidator({
                    rules: this.validation,
                    thisObject: this
                }),
                lastValidation = null,
                lastResult = null

            this.addRules = function () {
                evalidator.addRules.apply(evalidator, arguments)
                return this
            }

            this.validate = function (method) {
                if (!evalidator.hasScenario(method))
                    method = null
                if (!lastValidation || this.hasChanged()) {
                    return lastValidation = evalidator.validate(this.attributes, method)
                }
                return lastValidation
            }

            this.getErrors = function (prop) {
                if (lastResult)
                    return lastResult.getErrors(prop)
                else
                    return []
            }

            proto.constructor.apply(this, arguments)

            this.on('saving', function (model, attrs, options) {
                return this.validate(options.method)
                    .then(function (result) {
                        lastResult = result
                        if (result.hasError())
                            throw new ValidationError(result.getErrors())
                    })
            })
        }
    })

    Bookshelf.Model = Model
}

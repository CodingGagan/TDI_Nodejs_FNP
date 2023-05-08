
$(document).ready(function () {
    $('#contact_form').bootstrapValidator({
        fields: {
            email: {
                validators: {
                    notEmpty: {
                        message: "This field is required."
                    },
                    callback: {
                        message: 'The input is not valid',
                        callback: (value) => {
                            if (value === '') {
                                return true;
                            }
                            // Check email validity
                            if (value.search(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) < 0) {
                                return {
                                    valid: false,
                                    message: 'Invalid email.'
                                }
                            }
                            // Check minimum strength
                            if (value.length < 5) {
                                return {
                                    valid: false,
                                    message: 'This field must contain minimum 5 characters.'
                                };
                            }
                            // Check minimum strength
                            if (value.length >= 80) {
                                return {
                                    valid: false,
                                    message: 'This field must contain maximum 80 characters.'
                                };
                            }
                            return true;
                        }
                    },
                }
            },
            full_name: {
                validators: {
                    notEmpty: {
                        message: "This field is required."
                    },
                    callback: {
                        message: 'The input is not valid',
                        callback: (value) => {
                            if (value === '') {
                                return true;
                            }
                            // Regex to check Special characters
                            if (value.search(/^[A-Za-z0-9 ]+$/) < 0) {
                                return {
                                    valid: false,
                                    message: 'Special Characters not allowed.'
                                }
                            }
                            // Check minimum length
                            if (value.length < 1) {
                                return {
                                    valid: false,
                                    message: 'This field must contain minimum 1 character.'
                                };
                            }
                            // Check minimum length
                            if (value.length >= 100) {
                                return {
                                    valid: false,
                                    message: 'This field must contain maximum 40 characters.'
                                };
                            }
                            return true;
                        }
                    },
                },
            },
            comments: {
                validators: {
                    notEmpty: {
                        message: "This field is required."
                    },
                    callback: {
                        message: 'The input is not valid.',
                        callback: (value) => {
                            if (value === '') {
                                return true;
                            }
                            // Regex to check Special characters
                            if (value.search(/^[A-Za-z0-9 ]+$/) < 0) {
                                return {
                                    valid: false,
                                    message: 'Special Characters not allowed.'
                                }
                            }
                            // Check minimum strength
                            if (value.length < 1) {
                                return {
                                    valid: false,
                                    message: 'This field must contain minimum 1 character.'
                                };
                            }
                            // Check minimum strength
                            if (value.length >= 500) {
                                return {
                                    valid: false,
                                    message: 'This field must contain maximum 500 characters.'
                                };
                            }
                            return true;
                        }
                    },
                },
            },
        }
    })

    $('#careers_form').bootstrapValidator({
        fields: {
            job_id: {
                validators: {
                    choice: {
                        required: true,
                        min: 1,
                        message: 'Please check at least one job position.',
                    }
                }
            },
            first_name: {
                validators: {
                    notEmpty: {
                        message: "This field is required."
                    },
                    callback: {
                        message: 'The input is not valid.',
                        callback: (value) => {
                            if (value === '') {
                                return true;
                            }
                            // Regex to check Special characters
                            if (value.search(/^[A-Za-z0-9 ]+$/) < 0) {
                                return {
                                    valid: false,
                                    message: 'Special Characters not allowed.'
                                }
                            }
                            // Check minimum length
                            if (value.length < 1) {
                                return {
                                    valid: false,
                                    message: 'This field must contain minimum 1 character.'
                                };
                            }
                            // Check minimum length
                            if (value.length >= 20) {
                                return {
                                    valid: false,
                                    message: 'This field must contain maximum 20 characters.'
                                };
                            }
                            return true;
                        }
                    },
                },
            },
            last_name: {
                validators: {
                    notEmpty: {
                        message: "This field is required."
                    },
                    callback: {
                        message: 'The input is not valid.',
                        callback: (value) => {
                            if (value === '') {
                                return true;
                            }
                            // Regex to check Special characters
                            if (value.search(/^[A-Za-z0-9 ]+$/) < 0) {
                                return {
                                    valid: false,
                                    message: 'Special Characters not allowed.'
                                }
                            }
                            // Check minimum length
                            if (value.length < 1) {
                                return {
                                    valid: false,
                                    message: 'This field must contain minimum 1 character.'
                                };
                            }
                            // Check minimum length
                            if (value.length >= 20) {
                                return {
                                    valid: false,
                                    message: 'This field must contain maximum 20 characters.'
                                };
                            }
                            return true;
                        }
                    },
                },

            },
            email: {
                validators: {
                    notEmpty: {
                        message: "This field is required."
                    },
                    callback: {
                        message: 'The input is not valid.',
                        callback: (value) => {
                            if (value === '') {
                                return true;
                            }
                            //Regex to check valid email
                            if (value.search(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) < 0) {
                                return {
                                    valid: false,
                                    message: 'Invalid email.'
                                }
                            }
                            // Check minimum length
                            if (value.length < 5) {
                                return {
                                    valid: false,
                                    message: 'This field must contain minimum 5 characters.'
                                };
                            }
                            // Check minimum length
                            if (value.length >= 80) {
                                return {
                                    valid: false,
                                    message: 'This field must contain maximum 80 characters.'
                                };
                            }
                            return true;
                        }
                    },
                }
            },
            telephone: {
                validators: {
                    notEmpty: {
                        message: "This field is required"
                    },
                    callback: {
                        message: 'The input is not valid',
                        callback: (value) => {
                            if (value === '') {
                                return true;
                            }
                            // Regex to check special characters and alphabets
                            if (value.search(/^[0-9]+$/) < 0) {
                                return {
                                    valid: false,
                                    message: 'Alphabets and special characters not allowed.'
                                }
                            }
                            // Check minimum length
                            if (value.length < 7) {
                                return {
                                    valid: false,
                                    message: 'This field must contain minimum 7 characters.'
                                };
                            }
                            // Check minimum length
                            if (value.length >= 15) {
                                return {
                                    valid: false,
                                    message: 'This field must contain maximum 15 characters.'
                                };
                            }
                            return true;
                        }
                    },
                },
            },

            resume: {
                validators: {
                    notEmpty: {
                        message: "This field is required."
                    },
                    file: {
                        extension: 'pdf,doc,zip',
                        type: 'application/pdf,application/msword,application/zip',
                        maxSize: 2 * 1024 * 1024,
                        message: `The selected file is not valid. Valid extensions are: pdf, doc, zip.`
                    },
                },
            },
        }
    })

    $('#subscribe_form').bootstrapValidator({
        fields: {
            email: {
                validators: {
                    notEmpty: {
                        message: "This field is required."
                    },
                    callback: {
                        message: 'The input is not valid.',
                        callback: (value) => {
                            if (value === '') {
                                return true;
                            }
                            if (value.search(/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/) < 0) {
                                return {
                                    valid: false,
                                    message: 'Invalid email.'
                                }
                            }
                            // Check minimum length
                            if (value.length < 5) {
                                return {
                                    valid: false,
                                    message: 'This field must contain minimum 5 characters.'
                                };
                            }
                            // Check minimum length
                            if (value.length >= 80) {
                                return {
                                    valid: false,
                                    message: 'This field must contain maximum 80 characters.'
                                };
                            }
                            return true;
                        }
                    },
                }
            }
        }
    })

    $('#product-search').bootstrapValidator({
        fields: {
            product_name: {
                validators: {
                    notEmpty: {
                        message: "This field is required."
                    },
                }
            }
        }
    })
});// end document



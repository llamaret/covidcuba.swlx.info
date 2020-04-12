var domains = {
    'cu': 'Cuba',
    'it': 'Italia',
    'be': 'Bélgica',
    'us': 'USA',
    'fr': 'Francia',
    'ca': 'Canadá',
    'es': 'España',
    'cn': 'China',
    'ru': 'Rusia',
    'uy': 'Uruguay',
    'do': 'R.Dominicana',
    'hr': 'Croacia',
    'co': 'Colombia',
    'pe': 'Perú',
    'tz': 'Tanzania',
    'pa': 'Panamá',
    'bo': 'Bolivia'
};



var contagio = {
    'importado': 0,
    'introducido': 0,
    'autoctono': 0,
    'desconocido': 0
}

$.ajaxSetup({cache: false});

$.getJSON("assets/data/paises-recovered-dias.json", function (all_recovers) {
  $.getJSON("assets/data/paises-death-dias.json", function (all_deaths) {
    $.getJSON("assets/data/paises-info-dias.json", function (countriesdays) {
        $.getJSON("assets/data/covid19-cuba.json", function (data) {
            $.getJSON("assets/data/provincias.geojson", function (provincias) {
                $.getJSON("assets/data/municipios.geojson",
                    function (municipios) {

                        function getMunicipeByCode(code) {
                            for (m in municipios.features) {
                                if (municipios.features[m].properties.DPA_municipality_code == code) {
                                    return municipios.features[m];
                                    break;
                                }
                            }
                        }

                        function getCodeByMunicipeName(name) {
                            for (m in municipios.features) {
                                if (municipios.features[m].properties.municipality == name) {
                                    return municipios.features[m];
                                    break;
                                }
                            }
                        }

                        function getProvinceByCode(code) {
                            for (p in provincias.features) {
                                if (provincias.features[p].properties.DPA_province_code === code) {
                                    return provincias.features[p];
                                    break;
                                }
                            }
                        }

                        function getCodeByProvinceName(name) {
                            for (p in provincias.features) {
                                if (provincias.features[p].properties.province === name) {
                                    return provincias.features[p];
                                    break;
                                }
                            }
                        }

                        var factor = 150;

                        var curves = {};

                        function logx(base, x) {
                            if (base == 10) {
                                return Math.log10(x);
                            }
                            return Math.log10(x) / Math.log10(base);
                        }

                        function getCountryFromDomain(dom) {
                            if (dom in domains) {
                                return domains[dom];
                            }
                            if (dom == 'unknown') {
                                return 'Desconocido';
                            }
                            return dom;
                        }

                        function getAllCasesAndSimpleGraphics() {
                            var cases = {};
                            var deaths = 0;
                            var gone = 0;
                            var recov = 0;
                            var sex_male = 0;
                            var sex_female = 0;
                            var sex_unknown = 0;
                            var countries = {};
                            var ages = {
                                '0-4': 0,
                                '5-9': 0,
                                '10-18': 0,
                                '19-40': 0,
                                '41-60': 0,
                                '61-80': 0,
                                '81 o más': 0,
                                'Desconocido': 0
                            }
                            var total_cu = 0;
                            var total_no_cu = 0;
                            var total_unk = 0;
                            var total_tests = 0;

                            for (var day in data.casos.dias) {
                                if ('diagnosticados' in data.casos.dias[day]) {
                                    var diag = data.casos.dias[day].diagnosticados;
                                    for (var p in diag) {
                                        cases[diag[p].id] = diag[p];
                                        cases[diag[p].id]['fecha'] = data.casos.dias[day].fecha;

                                        //cuban/no cuban
                                        if (diag[p].pais == 'cu') {
                                            total_cu += 1;
                                        } else {
                                            if (diag[p].pais == 'unknown') {
                                                total_unk += 1;
                                            } else {
                                                total_no_cu += 1;
                                            }
                                        }

                                        //sex
                                        if (diag[p].sexo == 'hombre') {
                                            sex_male += 1;
                                        } else {
                                            if (diag[p].sexo == 'mujer') {
                                                sex_female += 1;
                                            } else {
                                                sex_unknown += 1;
                                            }
                                        }

                                        //countries
                                        if (!(diag[p].pais in countries)) {
                                            countries[diag[p].pais] = 1;
                                        } else {
                                            countries[diag[p].pais] += 1;
                                        }

                                        //ages
                                        if (diag[p].edad == null) {
                                            ages['Desconocido'] += 1
                                        } else if ((diag[p].edad >= 0) && (diag[p].edad <= 4)) {
                                            ages['0-4'] += 1
                                        } else if ((diag[p].edad >= 5) && (diag[p].edad <= 9)) {
                                            ages['5-9'] += 1
                                        } else if ((diag[p].edad >= 10) && (diag[p].edad <= 18)) {
                                            ages['10-18'] += 1
                                        } else if ((diag[p].edad >= 19) && (diag[p].edad <= 40)) {
                                            ages['19-40'] += 1
                                        } else if ((diag[p].edad >= 41) && (diag[p].edad <= 60)) {
                                            ages['41-60'] += 1
                                        } else if ((diag[p].edad >= 61) && (diag[p].edad <= 80)) {
                                            ages['61-80'] += 1
                                        } else {
                                            ages['81 o más'] += 1
                                        }

                                        //contagio
                                        if (diag[p].contagio == null) {
                                            contagio.desconocido += 1;
                                        } else {
                                            contagio[diag[p].contagio] += 1;
                                        }

                                    }
                                }
                                if ('muertes_numero' in data.casos.dias[day]) {
                                    deaths += data.casos.dias[day].muertes_numero;
                                }
                                if ('evacuados_numero' in data.casos.dias[day]) {
                                    gone += data.casos.dias[day].evacuados_numero;
                                }
                                if ('recuperados_numero' in data.casos.dias[day]) {
                                    recov += data.casos.dias[day].recuperados_numero;
                                }

                                if ('tests_total' in data.casos.dias[day]) {
                                    if (total_tests <= data.casos.dias[day].tests_total) {
                                        total_tests = data.casos.dias[day].tests_total;
                                    }
                                }
                            }

                            //Pie for sex
                            c3.generate({
                                bindto: "#sex-info",
                                data: {
                                    columns: [['Hombres', sex_male], ['Mujeres', sex_female], ['No reportado', sex_unknown]],
                                    type: 'pie',
                                    colors: {
                                        'Mujeres': '#520924',
                                        'Hombres': '#003366',
                                        'No reportado': '#008E76'
                                    }
                                }
                            });


                            //Pie for cubans/no cubans
                            c3.generate({
                                bindto: "#countries-info-pie",
                                data: {
                                    columns: [['cubanos', total_cu], ['extranjeros', total_no_cu], ['no reportado', total_unk]],
                                    type: 'pie',
                                    colors: {
                                        'cubanos': '#520924',
                                        'extranjeros': '#003366',
                                        'no reportado': '#008E76'
                                    }
                                }
                            });

                            //Donut for tests
                            c3.generate({
                                bindto: "#tests-donut-info",
                                data: {
                                    columns: [['Tests Positivos', total_cu + total_no_cu + total_unk], ['Tests Negativos', total_tests - (total_cu + total_no_cu + total_unk)]],
                                    type: 'donut',
                                    colors: {
                                        'Tests Positivos': '#520924',
                                        'Tests Negativos': '#003366',
                                    }
                                },
                                donut: {
                                    title: total_tests + " tests",
                                }
                            });

                            //Bar for countries
                            var country = ['País'];
                            var countryDiagnoses = ['Diagnosticados'];
                            for (var c in countries) {
                                if (c != 'cu') {
                                    country.push(getCountryFromDomain(c));
                                    countryDiagnoses.push(countries[c]);
                                }
                            }
                            c3.generate({
                                bindto: "#countries-info",
                                data: {
                                    x: country[0],
                                    columns: [
                                        country,
                                        countryDiagnoses
                                    ],
                                    type: 'bar',
                                    colors: {
                                        'Diagnosticados': '#520924'
                                    }
                                },
                                axis: {
                                    x: {
                                        label: 'País',
                                        type: 'categorical',
                                        tick: {
                                            rotate: -30,
                                            multiline: false
                                        },
                                        height: 45
                                    },
                                    y: {
                                        label: 'Casos',
                                        position: 'outer-middle',
                                    }
                                }
                            });

                            //Bar for ages
                            var range = ['Rango Etario'];
                            var rangeDiagnoses = ['Diagnosticados'];
                            for (var r in ages) {
                                range.push(r);
                                rangeDiagnoses.push(ages[r]);
                            }
                            c3.generate({
                                bindto: "#ages-info",
                                data: {
                                    x: range[0],
                                    columns: [
                                        range,
                                        rangeDiagnoses
                                    ],
                                    type: 'bar',
                                    colors: {
                                        'Diagnosticados': '#520924'
                                    }
                                },
                                axis: {
                                    x: {
                                        label: 'Rango etario',
                                        type: 'categorical'
                                    },
                                    y: {
                                        label: 'Casos',
                                        position: 'outer-middle',
                                    }
                                }
                            });

                            //Pie for contagio
                            c3.generate({
                                bindto: "#contagio-info",
                                data: {
                                    columns: [['Importado', contagio.importado], ['Introducido', contagio.introducido], ['Autóctono', contagio.autoctono], ['Desconocido', contagio.desconocido]],
                                    type: 'pie',
                                    colors: {
                                        'Introducido': '#520924',
                                        'Importado': '#003366',
                                        'Autóctono': '#008E76',
                                        'Desconocido': '#F16645'
                                    }
                                }
                            });

                            //Lines for contagio evolution
                            var dates = ['Fecha'];
                            var dias = ['Días'];
                            var dailySingle = ['Casos en el día'];
                            var dailySum = ['Casos acumulados'];
                            var dailyActive = ['Casos activos']
                            var cuba = ['Cuba'];
                            var deadsSum = ['Muertes acumuladas'];
                            var deadsSingle = ['Muertes en el día'];
                            var recoversSum = ['Altas acumuladas'];
                            var recoversSingle = ['Altas en el día'];
                            var cantidad_dias = 0;
                            var sujetos_riesgo = 0;
                            var graves_numero = 0;
                            var muertes_hoy = 0;
                            var recuperados_hoy = 0;
                            var casos_hoy = 0;
                            var test_days = [];
                            var test_negative = [];
                            var test_positive = [];
                            var test_cases = [];
                            var total = 0;
                            var active = 0;
                            var deads = 0;
                            var recover = 0;
                            var evac = 0;


                            for (var i = 1; i <= Object.keys(data.casos.dias).length; i++) {
                                cantidad_dias++;
                                if (data.casos.dias[i]["sujetos_riesgo"]) {
                                  sujetos_riesgo = data.casos.dias[i]["sujetos_riesgo"]
                                }
                                if (data.casos.dias[i]["graves_numero"]) {
                                  graves_numero = data.casos.dias[i]["graves_numero"]
                                }
                                if (data.casos.dias[i]["muertes_numero"]) {
                                  muertes_hoy = data.casos.dias[i]["muertes_numero"]
                                }
                                else {
                                  muertes_hoy = 0;  
                                }
                                if (data.casos.dias[i]["recuperados_numero"]) {
                                  recuperados_hoy = data.casos.dias[i]["recuperados_numero"]
                                }
                                else {
                                  recuperados_hoy = 0;  
                                }
                                dias.push('Día ' + i);
                                dates.push(data.casos.dias[i].fecha.replace('2020/', ''));
                                if ('diagnosticados' in data.casos.dias[i]) {
                                    dailySingle.push(data.casos.dias[i]['diagnosticados'].length);
                                    total += data.casos.dias[i]['diagnosticados'].length;
                                    casos_hoy = data.casos.dias[i]['diagnosticados'].length;
                                } else {
                                    dailySingle.push(0);
                                    casos_hoy = 0;
                                }
                                if ('tests_total' in data.casos.dias[i]) {
                                    test_days.push(data.casos.dias[i].fecha.replace('2020/', ''));
                                    test_cases.push(data.casos.dias[i].tests_total);
                                    test_negative.push(data.casos.dias[i].tests_total - total);
                                    test_positive.push(total);
                                }
                                if ('recuperados_numero' in data.casos.dias[i]) {
                                  recover += data.casos.dias[i].recuperados_numero;
                                  recoversSingle.push(data.casos.dias[i].recuperados_numero);
                                } else {
                                  recoversSingle.push(0);
                                }
                                if ('muertes_numero' in data.casos.dias[i]) {
                                  deads += data.casos.dias[i].muertes_numero;
                                  deadsSingle.push(data.casos.dias[i].muertes_numero);
                                } else {
                                  deadsSingle.push(0);
                                }
                                if ('evacuados_numero' in data.casos.dias[i]) {
                                  evac += data.casos.dias[i].evacuados_numero;
                                }

                                dailySum.push(total);
                                dailyActive.push(total - (recover + deads + evac));
                                recoversSum.push(recover);
                                deadsSum.push(deads);
                                cuba.push(total);
                            }

                            var ntest_days = ['Fecha'];
                            var ntest_negative = ['Tests Negativos'];
                            var ntest_positive = ['Tests Positivos'];
                            var ntest_cases = ['Total de Tests'];
                            for (var i = 1; i < test_cases.length; i++) {
                                ntest_days.push(test_days[i]);
                                ntest_cases.push(test_cases[i] - test_cases[i - 1]);
                                ntest_negative.push(test_negative[i] - test_negative[i - 1]);
                                ntest_positive.push(test_positive[i] - test_positive[i - 1]);
                            }


                            $('[data-content=update]').html(dates[dates.length - 1]);
                            $('[data-content=update1]').html('2020/' + dates[dates.length - 1]);


                            tests = c3.generate({
                                bindto: "#tests-line-info",
                                data: {
                                    x: ntest_days[0],
                                    columns: [
                                        ntest_days,
                                        ntest_negative,
                                        ntest_positive,
                                        ntest_cases
                                    ],
                                    type: 'bar',
                                    groups: [['Tests Negativos', 'Tests Positivos']],
                                    colors: {
                                        'Tests Negativos': '#003366',
                                        'Tests Positivos': '#520924',
                                        'Total de Tests': '#008E76'
                                    }
                                },
                                axis: {
                                    x: {
                                        label: 'Fecha',
                                        type: 'categorical',
                                        //show: false
                                    },
                                    y: {
                                        label: 'Tests en el día',
                                        position: 'outer-middle'
                                    }
                                }
                            });

                            var countrysorted = [];
                            for (var c in countriesdays.paises) {
    //                            if ((countriesdays.paises[c].length + 1) >= cuba.length) {

                                    var c_temp = [c];
                                    var d_temp = ['Días'];
                                    for (var i = 1; i < countriesdays.paises[c].length; i++) {
                                        c_temp.push(countriesdays.paises[c][i]);
                                        d_temp.push('Día ' + i);
                                    }
                                    curves[c] = {'dias': d_temp, 'data': c_temp};
                                    countrysorted.push(c);
     //                           }
                            }
                            countrysorted.sort();
                            for (var c = 0; c < countrysorted.length; c++) {
                                var cc = curves[countrysorted[c]]['data'][0];
                                $('#countrycurve-select').append('<option value="' + cc + '">' + cc + '</option>');
                            }
                            var countryselected = 'Hungary';
                            $('#countrycurve-select').val(countryselected);
                            $('.countries-date').html(countriesdays['dia-actualizacion']);

                            $('#countrycurve-select').on('change', function () {
                                var val = $('#countrycurve-select').val();
                                comparison.unload({ids: countryselected});
                                curve.unload({ids: countryselected});
                                countryselected = val;
                                comparison.load({columns: [curves[countryselected]['data']]});
                                curve.load({columns: [curves[countryselected]['data']]});

                                comparison = c3.generate({
                                    bindto: "#countries-comparison",
                                    data: {
                                        x: dias[0],
                                        columns: [
                                            dias,
                                            cuba,
                                            curves[countryselected]['data']
                                        ],
                                        type: 'line',
                                        colors: {
                                            'Cuba': '#520924'
                                        }
                                    },
                                    axis: {
                                        x: {
                                            label: 'Fecha',
                                            type: 'categorical',
                                            show: false
                                        },
                                        y: {
                                            label: 'Casos',
                                            position: 'outer-middle'
                                        }
                                    }
                                });

                                curve = c3.generate({
                                    bindto: "#countries-curve",
                                    data: {
                                        x: 'Días',
                                        columns: [
                                            curves[countryselected]['dias'],
                                            curves[countryselected]['data'],
                                            cuba,
                                        ],
                                        type: 'line',
                                        colors: {
                                            'Cuba': '#520924'
                                        }
                                    },
                                    axis: {
                                        x: {
                                            label: 'Fecha',
                                            type: 'categorical',
                                            show: false
                                        },
                                        y: {
                                            label: 'Casos',
                                            position: 'outer-middle'
                                        }
                                    },
                                    grid: {
                                        x: {
                                            lines: [{'value': dias[dias.length - 1], 'text': dias[dias.length - 1]}]
                                        }
                                    }
                                });

                            });

                            // Comparación de muertes

                            death_curve = {};
                            var death_countrysorted = [];
                            for (var c in all_deaths.paises) {
                                if (countriesdays.paises[c] && countriesdays.paises[c].length > all_deaths.paises[c].length) {
                                  var fill_count = countriesdays.paises[c].length - all_deaths.paises[c].length;
                                  all_deaths.paises[c] = Array(fill_count).fill(0).concat(all_deaths.paises[c]);
                                }
                              //  if (all_deaths.paises[c].length >= cuba.length) {
                                    var c_temp = [c];
                                    var d_temp = ['Días'];
                                    for (var i = 1; i < all_deaths.paises[c].length; i++) {
                                        c_temp.push(all_deaths.paises[c][i]);
                                        d_temp.push('Día ' + i);
                                    }
                                    death_curve[c] = {'dias': d_temp, 'data': c_temp};
                                    death_countrysorted.push(c);
                               // }
                            }
                            death_countrysorted.sort();
                            for (var c = 0; c < death_countrysorted.length; c++) {
                                var cc = death_curve[death_countrysorted[c]]['data'][0];
                                $('#deathcurve-select').append('<option value="' + cc + '">' + cc + '</option>');
                            }
                            deaths_cuba = Array(cuba.length - deadsSum.length).fill(0).concat(deadsSum.slice(1, deadsSum.length));
                            deaths_cuba[0] = "Cuba";

                            var death_countryselected = 'Cambodia';

                            $('#deathcurve-select').val(death_countryselected);
                            $('.deaths-date').html(all_deaths['dia-actualizacion']);

                            $('#deathcurve-select').on('change', function () {
                                var val = $('#deathcurve-select').val();
                                death_comparison.unload({ids: death_countryselected});
                                death_graph.unload({ids: death_countryselected});
                                death_countryselected = val;
                                death_comparison.load({columns: [death_curve[death_countryselected]['data']]});
                                death_graph.load({columns: [death_curve[death_countryselected]['data']]});

                                death_comparison = generate_death_comparison(death_countryselected);
                                death_graph = generate_death_graph(death_countryselected)

                            });

                             var generate_death_comparison = function(country){
                              return c3.generate({
                                bindto: "#deaths-comparison",
                                data: {
                                    x: dias[0],
                                    columns: [
                                        dias,
                                        deaths_cuba,
                                        death_curve[death_countryselected]['data'].slice(0, cuba.length)
                                    ],
                                    type: 'line',
                                    colors: {
                                        'Cuba': '#520924'
                                    }
                                },
                                axis: {
                                    x: {
                                        label: 'Fecha',
                                        type: 'categorical',
                                        show: false
                                    },
                                    y: {
                                        label: 'Muertes',
                                        position: 'outer-middle'
                                    }
                                }
                            })};

                            death_comparison = generate_death_comparison(death_countryselected)

                            var generate_death_graph = function(){

                              return c3.generate({
                                  bindto: "#deaths-curve",
                                  data: {
                                      x: 'Días',
                                      columns: [
                                          death_curve[death_countryselected]['dias'],
                                          deaths_cuba,
                                          death_curve[death_countryselected]['data'],
                                      ],
                                      type: 'line',
                                      colors: {
                                          'Cuba': '#520924'
                                      }
                                  },
                                  axis: {
                                      x: {
                                          label: 'Fecha',
                                          type: 'categorical',
                                          show: false
                                      },
                                      y: {
                                          label: 'Muertes',
                                          position: 'outer-middle'
                                      }
                                  },
                                  grid: {
                                      x: {
                                          lines: [{'value': dias[dias.length - 1], 'text': dias[dias.length - 1]}]
                                      }
                                  }
                              });
                            };

                            death_graph = generate_death_graph()

                            // Comparación de recuperados

                            recover_curve = {};
                            var recover_countrysorted = [];
                            for (var c in all_recovers.paises) {
                                if (countriesdays.paises[c] && countriesdays.paises[c].length > all_recovers.paises[c].length) {
                                  var fill_count = countriesdays.paises[c].length - all_recovers.paises[c].length;
                                  all_recovers.paises[c] = Array(fill_count).fill(0).concat(all_recovers.paises[c]);
                                }
                             //   if (all_recovers.paises[c].length >= cuba.length) {
                                    var c_temp = [c];
                                    var d_temp = ['Días'];
                                    for (var i = 1; i < all_recovers.paises[c].length; i++) {
                                        c_temp.push(all_recovers.paises[c][i]);
                                        d_temp.push('Día ' + i);
                                    }
                                    recover_curve[c] = {'dias': d_temp, 'data': c_temp};
                                    recover_countrysorted.push(c);
                             //   }
                            }
                            recover_countrysorted.sort();
                            for (var c = 0; c < recover_countrysorted.length; c++) {
                                var cc = recover_curve[recover_countrysorted[c]]['data'][0];
                                $('#recovercurve-select').append('<option value="' + cc + '">' + cc + '</option>');
                            }
                            recovers_cuba = Array(cuba.length - recoversSum.length).fill(0).concat(recoversSum.slice(1, recoversSum.length));
                            recovers_cuba[0] = "Cuba";

                            var recover_countryselected = 'Cambodia';

                            $('#recovercurve-select').val(recover_countryselected);
                            $('.recovers-date').html(all_recovers['dia-actualizacion']);

                            $('#recovercurve-select').on('change', function () {
                                var val = $('#recovercurve-select').val();
                                recover_comparison.unload({ids: recover_countryselected});
                                recover_graph.unload({ids: recover_countryselected});
                                recover_countryselected = val;
                                recover_comparison.load({columns: [recover_curve[recover_countryselected]['data']]});
                                recover_graph.load({columns: [recover_curve[recover_countryselected]['data']]});

                                recover_comparison = generate_recover_comparison(recover_countryselected);
                                recover_graph = generate_recover_graph(recover_countryselected)

                            });

                             var generate_recover_comparison = function(country){
                              return c3.generate({
                                bindto: "#recovers-comparison",
                                data: {
                                    x: dias[0],
                                    columns: [
                                        dias,
                                        recovers_cuba,
                                        recover_curve[recover_countryselected]['data'].slice(0, cuba.length)
                                    ],
                                    type: 'line',
                                    colors: {
                                        'Cuba': '#520924'
                                    }
                                },
                                axis: {
                                    x: {
                                        label: 'Fecha',
                                        type: 'categorical',
                                        show: false
                                    },
                                    y: {
                                        label: 'Recuperados',
                                        position: 'outer-middle'
                                    }
                                }
                            })};

                            recover_comparison = generate_recover_comparison(recover_countryselected)

                            var generate_recover_graph = function(){

                              return c3.generate({
                                  bindto: "#recovers-curve",
                                  data: {
                                      x: 'Días',
                                      columns: [
                                          recover_curve[recover_countryselected]['dias'],
                                          recovers_cuba,
                                          recover_curve[recover_countryselected]['data'],
                                      ],
                                      type: 'line',
                                      colors: {
                                          'Cuba': '#520924'
                                      }
                                  },
                                  axis: {
                                      x: {
                                          label: 'Fecha',
                                          type: 'categorical',
                                          show: false
                                      },
                                      y: {
                                          label: 'Recuperados',
                                          position: 'outer-middle'
                                      }
                                  },
                                  grid: {
                                      x: {
                                          lines: [{'value': dias[dias.length - 1], 'text': dias[dias.length - 1]}]
                                      }
                                  }
                              });
                            };

                            recover_graph = generate_recover_graph()

                            c3.generate({
                                bindto: "#daily-single-info",
                                data: {
                                    x: dates[0],
                                    columns: [
                                        dates,
                                        dailySingle,
                                        dailyActive,
                                        dailySum
                                    ],
                                    type: 'line',
                                    colors: {
                                        'Casos en el día': '#00577B',
                                        'Casos activos': '#B11116',
                                        'Casos acumulados': '#D0797C'
                                    }
                                },
                                axis: {
                                    x: {
                                        label: 'Fecha',
                                        type: 'categorical',
                                        show: false
                                    },
                                    y: {
                                        label: 'Casos',
                                        position: 'outer-middle',
                                    }
                                }
                            });

                            c3.generate({
                                bindto: "#daily-deads-info",
                                data: {
                                    x: dates[0],
                                    columns: [
                                        dates,
                                        deadsSingle,
                                        deadsSum
                                    ],
                                    type: 'line',
                                    colors: {
                                        'Muertes en el día': '#00577B',
                                        'Muertes acumuladas': '#003366'
                                    }
                                },
                                axis: {
                                    x: {
                                        label: 'Fecha',
                                        type: 'categorical',
                                        show: false
                                    },
                                    y: {
                                        label: 'Muertes',
                                        position: 'outer-middle',
                                    }
                                }
                            });

                            c3.generate({
                                bindto: "#daily-recovers-info",
                                data: {
                                    x: dates[0],
                                    columns: [
                                        dates,
                                        recoversSingle,
                                        recoversSum
                                    ],
                                    type: 'line',
                                    colors: {
                                        'Altas en el día': '#00577B',
                                        'Altas acumuladas': '#00AEEF'
                                    }
                                },
                                axis: {
                                    x: {
                                        label: 'Fecha',
                                        type: 'categorical',
                                        show: false
                                    },
                                    y: {
                                        label: 'Altas',
                                        position: 'outer-middle',
                                    }
                                }
                            });

                            comparison = c3.generate({
                                bindto: "#countries-comparison",
                                data: {
                                    x: dias[0],
                                    columns: [
                                        dias,
                                        cuba,
                                        curves[countryselected]['data'].slice(0, cuba.length)
                                    ],
                                    type: 'line',
                                    colors: {
                                        'Cuba': '#520924'
                                    }
                                },
                                axis: {
                                    x: {
                                        label: 'Fecha',
                                        type: 'categorical',
                                        show: false
                                    },
                                    y: {
                                        label: 'Casos',
                                        position: 'outer-middle'
                                    }
                                }
                            });

                            curve = c3.generate({
                                bindto: "#countries-curve",
                                data: {
                                    x: 'Días',
                                    columns: [
                                        curves[countryselected]['dias'],
                                        cuba,
                                        curves[countryselected]['data'],
                                    ],
                                    type: 'line',
                                    colors: {
                                        'Cuba': '#520924'
                                    }
                                },
                                axis: {
                                    x: {
                                        label: 'Fecha',
                                        type: 'categorical',
                                        show: false
                                    },
                                    y: {
                                        label: 'Casos',
                                        position: 'outer-middle'
                                    }
                                },
                                grid: {
                                    x: {
                                        lines: [{'value': dias[dias.length - 1], 'text': dias[dias.length - 1]}]
                                    }
                                }
                            });


                            return {"cases": cases, "deaths": deaths, "gone": gone, "recov": recov, "female": sex_female, "male": sex_male, "unknownsex": sex_unknown, "sujetos_riesgo": sujetos_riesgo, "graves_numero": graves_numero, "muertes_hoy": muertes_hoy, "recuperados_hoy": recuperados_hoy, "cantidad_dias": cantidad_dias, "casos_hoy": casos_hoy};
                        }


                        var globalInfo = getAllCasesAndSimpleGraphics();

                        var casos = globalInfo.cases;


                        function getAllRegions() {
                            var muns = {};
                            var pros = {};
                            for (var c in casos) {

                                if (!(casos[c].dpacode_municipio_deteccion in muns)) {
                                    muns[casos[c].dpacode_municipio_deteccion] = {"total": 1}
                                } else {
                                    muns[casos[c].dpacode_municipio_deteccion].total += 1;
                                }
                                if (!(casos[c].dpacode_provincia_deteccion in pros)) {
                                    pros[casos[c].dpacode_provincia_deteccion] = {"total": 1}
                                } else {
                                    pros[casos[c].dpacode_provincia_deteccion].total += 1;
                                }
                            }
                            return {'muns': muns, 'pros': pros};
                        }

                        var regions = getAllRegions();
                        var muns = regions.muns;
                        var pros = regions.pros;

                        function resumeCases() {
                            var max_muns = 0;
                            var max_pros = 0;
                            var total = 0;
                            for (var m in muns) {
                                if (max_muns < muns[m].total) {
                                    max_muns = muns[m].total;
                                }
                                total += muns[m].total;
                            }
                            for (var p in pros) {
                                if (max_pros < pros[p].total) {
                                    max_pros = pros[p].total;
                                }
                            }


                            return {
                                'max_muns': max_muns,
                                'max_pros': max_pros,
                                'total': total,
                                "deaths": globalInfo.deaths,
                                "gone": globalInfo.gone,
                                "recov": globalInfo.recov,
                                "male": globalInfo.male,
                                "female": globalInfo.female,
                                "sexunknown": globalInfo.sex_unknown,
                                "sujetos_riesgo": globalInfo.sujetos_riesgo,
                                "graves_numero": globalInfo.graves_numero,
                                "muertes_hoy": globalInfo.muertes_hoy,
                                "recuperados_hoy": globalInfo.recuperados_hoy,
                                "cantidad_dias": globalInfo.cantidad_dias,
                                "casos_hoy": globalInfo.casos_hoy
                            };
                        }

                        var genInfo = resumeCases();

                        var MAX_LISTS = 10;

                        muns_array = [];
                        for (var m in muns) {
                            muns_array.push({cod: m, total: muns[m].total});
                        }
                        muns_array.sort(function (a, b) {
                            return b.total - a.total
                        });

                        var $table_mun = $('#table-mun > tbody');
                        var mun_ranking = 1;
                        $(muns_array.slice(0, MAX_LISTS)).each(function (index, item) {
                            municipe = getMunicipeByCode(item.cod);
                            var row = ("<tr><td>{ranking}</td>" +
                                "<td>{cod} ({pro})</td>" +
                                "<td>{total}</td>" +
                                "<td>{rate}%</td></tr>")
                                .replace("{ranking}", mun_ranking)
                                .replace("{cod}", municipe.properties.municipality)
                                .replace("{pro}", municipe.properties.province)
                                .replace('{total}', item.total)
                                .replace('{rate}', (item.total * 100 / genInfo.total).toFixed(2));
                            $table_mun.append(row);
                            mun_ranking += 1;
                        });

                        pros_array = [];
                        for (var m in pros) {
                            pros_array.push({cod: m, total: pros[m].total});
                        }
                        pros_array.sort(function (a, b) {
                            return b.total - a.total
                        });

                        var $table_pro = $('#table-pro > tbody');
                        var pro_ranking = 1;
                        $(pros_array.slice(0, MAX_LISTS)).each(function (index, item) {
                            var row = ("<tr><td>{ranking}</td>" +
                                "<td>{cod}</td>" +
                                "<td>{total}</td>" +
                                "<td>{rate}%</td></tr>")
                                .replace("{ranking}", pro_ranking)
                                .replace("{cod}", getProvinceByCode(item.cod).properties.province)
                                .replace('{total}', item.total)
                                .replace('{rate}', (item.total * 100 / genInfo.total).toFixed(2));
                            $table_pro.append(row);
                            pro_ranking += 1;
                        });

        $('[data-content=diagno]').html(genInfo.total);
        $('[data-content=ingresados]').html(genInfo.sujetos_riesgo);
        $('[data-content=dia_pandem]').html(genInfo.cantidad_dias);
        $('[data-content=graves]').html(genInfo.graves_numero);
        $('[data-content=fallec_hoy]').html(genInfo.muertes_hoy);
        $('[data-content=recupe_hoy]').html(genInfo.recuperados_hoy);
        $('[data-content=diagno_hoy]').html(genInfo.casos_hoy);
        $('[data-content=activo]').html(genInfo.total -(genInfo.deaths + genInfo.gone +genInfo.recov));
        $('[data-content=fallec]').html(genInfo.deaths);
        $('[data-content=evacua]').html(genInfo.gone);
        $('[data-content=recupe]').html(genInfo.recov);
        $('[data-content=mortalidad]').html((genInfo.deaths*100/genInfo.total).toFixed(2));
        $('[data-content=recuperacion]').html((genInfo.recov*100/genInfo.total).toFixed(2));

                        var geojsonM = L.geoJSON(municipios, {style: styleM});

                        var geojsonP = L.geoJSON(provincias, {style: styleP});

                        geojsonM.bindTooltip(function (layer) {
                            return '<span class="bd">' + layer.feature.properties.province + '</span> - ' + layer.feature.properties.municipality;
                        }, {'sticky': true});

                        geojsonP.bindTooltip(function (layer) {
                            return '<span class="bd">' + layer.feature.properties.province + '</span>';
                        }, {'sticky': true});

                        function getMunProfile(code, mun, pro) {
                            var t = '';
                            t += '<div class="small-pname"><span class="bd">' + pro + '</span> - <span>' + mun + '</span></div>';
                            if (code in muns) {
                                t += '<div class="small-content"><span class="bd">Diagnosticados:</span> <span>' + muns[code].total + '</span></div>';
                            } else {
                                t += '<div class="small-content">No hay casos diagnosticados</div>';
                            }
                            t += '<div class="small-plink">&nbsp;</div>';

                            return t;
                        }

                        function getProProfile(code, pro) {
                            var t = '';
                            t += '<div class="small-pname"><span class="bd">' + pro + '</span></div>';
                            if (code in pros) {
                                t += '<div class="small-content"><span class="bd">Diagnosticados:</span> <span>' + pros[code].total + '</span></div>';
                            } else {
                                t += '<div class="small-content">Sin casos reportados aún</div>';
                            }
                            t += '<div class="small-plink">&nbsp;</div>';

                            return t;
                        }

                        geojsonM.bindPopup(function (layer) {
                            var mcode = layer.feature.properties.DPA_municipality_code;
                            var mun = layer.feature.properties.municipality;
                            var pro = layer.feature.properties.province;
                            return getMunProfile(mcode, mun, pro);
                        });

                        geojsonP.bindPopup(function (layer) {
                            var pcode = layer.feature.properties.DPA_province_code;
                            var pro = layer.feature.properties.province;
                            return getProProfile(pcode, pro);
                        });

                        function styleM(feature) {
                            return {
                                weight: 0.5,
                                opacity: 0.8,
                                color: '#f5f1f1',
                                fillOpacity: 1,
                                fillColor: getColorM(feature.properties.DPA_municipality_code)
                            };
                        }

                        function styleP(feature) {
                            return {
                                weight: 0.5,
                                opacity: 0.8,
                                color: '#f5f1f1',
                                fillOpacity: 1,
                                fillColor: getColorP(feature.properties.DPA_province_code)
                            };
                        }

                        $('#cases1').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_muns * factor * 0.2 / genInfo.max_muns) + ")");
                        $('#cases2').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_muns * factor * 0.4 / genInfo.max_muns) + ")");
                        $('#cases3').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_muns * factor * 0.6 / genInfo.max_muns) + ")");
                        $('#cases4').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_muns * factor * 0.8 / genInfo.max_muns) + ")");
                        $('#cases5').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_muns * factor / genInfo.max_muns) + ")");
                        $('#cases').html(genInfo.max_muns);

                        function getColorM(code) {
                            if (code in muns) {
                                var opac = logx(factor, muns[code].total * factor / genInfo.max_muns);
                                return "rgba(0, 97, 84," + opac + ")";
                            }
                            return '#D1D2D4';
                        }

                        function getColorP(code) {
                            if (code in pros) {
                                var opac = logx(factor, pros[code].total * factor / genInfo.max_pros);
                                return "rgba(0, 97, 84," + opac + ")";
                            }
                            return '#D1D2D4';
                        }

                        var map_mun = L.map('map-mun', {
                            center: [21.5, -79.371124],
                            zoom: 15,
                            layers: [geojsonM],
                            keyboard: false,
                            dragging: true,
                            zoomControl: true,
                            boxZoom: false,
                            doubleClickZoom: false,
                            scrollWheelZoom: false,
                            tap: true,
                            touchZoom: true,
                            zoomSnap: 0.05,
                            maxBounds: geojsonM.getBounds()
                        });
                        map_mun.zoomControl.setPosition('topright');
                        map_mun.fitBounds(geojsonM.getBounds());

                        var map_pro = L.map('map-pro', {
                            center: [21.5, -79.371124],
                            zoom: 15,
                            layers: [geojsonP],
                            keyboard: false,
                            dragging: true,
                            zoomControl: true,
                            boxZoom: false,
                            doubleClickZoom: false,
                            scrollWheelZoom: false,
                            tap: true,
                            touchZoom: true,
                            zoomSnap: 0.05,
                            maxBounds: geojsonP.getBounds()
                        });
                        map_pro.zoomControl.setPosition('topright');
                        map_pro.fitBounds(geojsonP.getBounds());

                        $('#select-map').on('change', function (e) {
                            var val = $('#select-map').val();
                            if (val === 'map-mun') {
                                $('#cases1').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_muns * factor * 0.2 / genInfo.max_muns) + ")");
                                $('#cases2').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_muns * factor * 0.4 / genInfo.max_muns) + ")");
                                $('#cases3').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_muns * factor * 0.6 / genInfo.max_muns) + ")");
                                $('#cases4').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_muns * factor * 0.8 / genInfo.max_muns) + ")");
                                $('#cases5').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_muns * factor / genInfo.max_muns) + ")");
                                $('#cases').html(genInfo.max_muns);
                                $('#map-pro').hide();
                                $('#map-mun').show();
                                map_mun.invalidateSize();
                            } else {
                                $('#cases1').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_pros * factor * 0.2 / genInfo.max_pros) + ")");
                                $('#cases2').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_pros * factor * 0.4 / genInfo.max_pros) + ")");
                                $('#cases3').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_pros * factor * 0.6 / genInfo.max_pros) + ")");
                                $('#cases4').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_pros * factor * 0.8 / genInfo.max_pros) + ")");
                                $('#cases5').css('color', "rgba(0, 97, 84," + logx(factor, genInfo.max_pros * factor / genInfo.max_pros) + ")");
                                $('#cases').html(genInfo.max_pros);
                                $('#map-mun').hide();
                                $('#map-pro').show();
                                map_pro.invalidateSize();
                            }
                        }).change();
                    });


                    curves2 = {};

            var countrysorted2 = [];

            function scaleX(num){
              if(num==0){
                return 0;
              }
              return Math.log10(num);
            }
            function scaleY(num){
              if(num==0){
                return 0;
              }
              return Math.log10(num);
            }

            for(var c in countriesdays.paises){
              var weeksum=0;
              var weeks=[c];
              var accum=['Confirmados-'+c];
              var prevweek=0;
              var total=0;
                        var ctotal = 0;
              for(var i=1;i<countriesdays.paises[c].length;i++){
                            ctotal=countriesdays.paises[c][i];
                if(i%7==0){
                  total=countriesdays.paises[c][i-1];
                  if (total>30){
                    weeksum=countriesdays.paises[c][i-1]-prevweek;
                    weeks.push(scaleY(weeksum));
                    weeksum=0;
                    accum.push(scaleX(total));
                    prevweek=countriesdays.paises[c][i-1];
                  }
                }
              }
              curves2[c]={'weeks': weeks, 'cummulative_sum':accum, 'total': total,'ctotal':ctotal}
              countrysorted2.push(c);
            }

            columdata = [];
            xaxisdata = {};
            var cont=0;
            var topn=20;
                    countrysorted2.sort((a,b)=> curves2[b]['ctotal']-curves2[a]['ctotal']);
            var $table_country = $('#table-countries > tbody');
            
            for(var i = 0; i < countrysorted2.length; i++){
                var row = ("<tr><td>{ranking}</td>" +
                                "<td>{country}</td>" +
                                "<td>{cases}</td></tr>")
                                .replace("{ranking}", i+1)
                                .replace("{country}", curves2[countrysorted2[i]]['weeks'][0])
                                .replace('{cases}', curves2[countrysorted2[i]]['ctotal']);
                        $table_country.append(row);
            }
            
            for(var i=0;i<countrysorted2.length;i++){
              xaxisdata[countrysorted2[i]]='Confirmados-'+countrysorted2[i];
              columdata.push(curves2[countrysorted2[i]]['weeks']);
              columdata.push(curves2[countrysorted2[i]]['cummulative_sum']);

              if(cont==topn){break;}
              cont+=1;
            }

            xaxisdata['Cuba']='Confirmados-Cuba';
            columdata.push(curves2['Cuba']['weeks']);
            columdata.push(curves2['Cuba']['cummulative_sum']);

            curve3 = c3.generate({
              bindto: "#curves-evolution",
              data: {
                  xs: xaxisdata,
                  columns: columdata,
                  type: 'line',
                  colors: {
                    'Cuba': '#520924'
                  }
                },
              tooltip: {
                  show: false
                },
              axis : {
                x : {
                  label: "Casos confirmados (log scale)",
                  tick: {
                    format: d3.format('.1f')
                  }
                },
                y: {
                  label: 'Casos nuevos  (log scale)',
                  position: 'outer-middle'
                }
              }
            });
            });
        });
    });

  });
});


TESTS = test/*.js
REPORTER = dot

test:
	@echo Run make test-cov for coverage reports
	@echo Mocha and Instanbul Node.js must be installed globally
	@NODE_ENV=test mocha \
		-R $(REPORTER) \
		$(TESTS)

instrument: clean
	istanbul instrument --output lib-cov --no-compact --variable global.__coverage__ lib


test-cov: clean instrument
	@echo Run make test for simple tests with no coverage reports
	@echo Mocha and Instanbul Node.js must be installed globally
	@COVERAGE=1 NODE_ENV=test mocha \
		-R mocha-istanbul \
		$(TESTS)
	@istanbul report
	@rm -rf lib-cov
	@echo
	@echo Open html-report/index.html file in your browser

clean:
	-rm -fr lib-cov
	-rm -fr covershot
	-rm -fr html-report
	-rm -fr coverage
	-rm -fr coverage.html

.PHONY: test-cov site docs test docclean

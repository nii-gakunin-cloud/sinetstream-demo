check:: check-py check-image check-dot_env

# check for same code between docker and venv.
check-py::
	for X in `cd docker/build/scripts && echo *.py`; do cmp docker/build/scripts/$$X venv/$$X || exit 1; done
# check for image match between doc and yml.
check-image::
	test `grep --no-filename 'image: ' README.md docker/docker-compose.yml | sort | uniq | wc -l` -eq 1
# check for same dot_env between docker and venv.
check-dot_env::
	for X in dot_env-high_rate-sample dot_env-low_rate-sample; do cmp docker/$$X venv/$$X || exit 1; done
